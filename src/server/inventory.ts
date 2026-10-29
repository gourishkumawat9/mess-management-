import "server-only";
import type { InventoryItem, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/api";
import type { MovementType } from "@/lib/constants";
import {
  STATUS_META,
  USAGE_WINDOW_DAYS,
  averageDailyUsage,
  roundQty,
  stockInsight,
  type StockInsight,
} from "@/lib/inventory";

const DAY_MS = 24 * 60 * 60 * 1000;

export type InventoryRow = InventoryItem & { insight: StockInsight };

/** Every active item with its live stock status, most urgent first. */
export async function listInventory(now = new Date()): Promise<InventoryRow[]> {
  const items = await prisma.inventoryItem.findMany({
    where: { archived: false },
    include: {
      movements: {
        where: { createdAt: { gte: new Date(now.getTime() - USAGE_WINDOW_DAYS * DAY_MS) }, change: { lt: 0 } },
        select: { type: true, change: true, createdAt: true },
      },
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  return items
    .map(({ movements, ...item }) => ({
      ...item,
      insight: stockInsight(item, averageDailyUsage(movements, item.createdAt, now), now),
    }))
    .sort((a, b) => STATUS_META[a.insight.status].rank - STATUS_META[b.insight.status].rank);
}

export async function getInventoryItem(id: string, now = new Date()) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!item) return null;
  const windowStart = now.getTime() - USAGE_WINDOW_DAYS * DAY_MS;
  const recent = item.movements.filter((m) => m.createdAt.getTime() >= windowStart);
  return { ...item, insight: stockInsight(item, averageDailyUsage(recent, item.createdAt, now), now) };
}

export async function createInventoryItem(
  data: Omit<Prisma.InventoryItemCreateInput, "movements">,
  userId: string,
) {
  const existing = await prisma.inventoryItem.findUnique({ where: { name: data.name } });
  if (existing) throw new HttpError(409, `"${data.name}" already exists`);
  const quantity = roundQty(Number(data.quantity ?? 0));
  return prisma.inventoryItem.create({
    data: {
      ...data,
      quantity,
      lastRestockedAt: quantity > 0 ? new Date() : null,
      movements:
        quantity > 0
          ? { create: { type: "ADJUSTMENT", change: quantity, balanceAfter: quantity, note: "Opening stock", userId } }
          : undefined,
    },
  });
}

export async function updateInventoryItem(id: string, data: Prisma.InventoryItemUpdateInput) {
  if (typeof data.name === "string") {
    const clash = await prisma.inventoryItem.findFirst({ where: { name: data.name, NOT: { id } } });
    if (clash) throw new HttpError(409, `"${data.name}" already exists`);
  }
  return prisma.inventoryItem.update({ where: { id }, data });
}

interface MovementInput {
  type: MovementType;
  /** Amount moved, or for ADJUSTMENT the new counted quantity. */
  quantity: number;
  unitCost?: number | null;
  note?: string | null;
}

/**
 * Locks an item's row until the transaction ends, so two people updating the
 * same item at once are applied one after the other instead of overwriting.
 */
async function lockItem(tx: Prisma.TransactionClient, itemId: string) {
  await tx.$executeRaw`SELECT 1 FROM "InventoryItem" WHERE "id" = ${itemId} FOR UPDATE`;
}

/** Applies one stock change inside an existing transaction. */
async function applyMovement(tx: Prisma.TransactionClient, itemId: string, input: MovementInput, userId: string) {
  await lockItem(tx, itemId);
  const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item || item.archived) throw new HttpError(404, "Inventory item not found");

  let change: number;
  switch (input.type) {
    case "RESTOCK":
      change = input.quantity;
      break;
    case "USAGE":
    case "WASTAGE":
      if (input.quantity > item.quantity + 1e-9) {
        throw new HttpError(400, `Only ${roundQty(item.quantity)} ${item.unit} of ${item.name} in stock`);
      }
      change = -input.quantity;
      break;
    case "ADJUSTMENT":
      change = input.quantity - item.quantity;
      break;
  }
  change = roundQty(change);
  if (change === 0 && input.type !== "ADJUSTMENT") throw new HttpError(400, "Quantity must be more than zero");

  const balanceAfter = roundQty(item.quantity + change);
  await tx.inventoryItem.update({
    where: { id: itemId },
    data: {
      quantity: balanceAfter,
      ...(input.type === "RESTOCK"
        ? { lastRestockedAt: new Date(), ...(input.unitCost != null ? { costPerUnit: input.unitCost } : {}) }
        : {}),
    },
  });
  if (change === 0) return null;
  return tx.stockMovement.create({
    data: {
      itemId,
      type: input.type,
      change,
      balanceAfter,
      unitCost: input.unitCost ?? null,
      note: input.note ?? null,
      userId,
    },
  });
}

export function recordMovement(itemId: string, input: MovementInput, userId: string) {
  return prisma.$transaction((tx) => applyMovement(tx, itemId, input, userId));
}

/**
 * End-of-day physical count. A count below the system figure is recorded as
 * usage (it feeds the consumption rate); a count above it is a correction.
 */
export async function recordStockCount(entries: { itemId: string; counted: number }[], userId: string, note?: string | null) {
  // Lock in a fixed order so two overlapping counts can't deadlock.
  const sorted = [...entries].sort((a, b) => a.itemId.localeCompare(b.itemId));
  return prisma.$transaction(async (tx) => {
    let changed = 0;
    for (const { itemId, counted } of sorted) {
      await lockItem(tx, itemId);
      const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
      if (!item || item.archived) throw new HttpError(404, "Inventory item not found");
      const diff = roundQty(counted - item.quantity);
      if (diff === 0) continue;
      const movement =
        diff < 0
          ? await applyMovement(tx, itemId, { type: "USAGE", quantity: -diff, note: note ?? "Daily stock count" }, userId)
          : await applyMovement(tx, itemId, { type: "ADJUSTMENT", quantity: counted, note: note ?? "Daily stock count" }, userId);
      if (movement) changed++;
    }
    return { changed };
  });
}

/** A supplier delivery covering several items at once. */
export async function recordDelivery(
  entries: { itemId: string; quantity: number; unitCost?: number | null }[],
  userId: string,
  note?: string | null,
) {
  const sorted = [...entries].sort((a, b) => a.itemId.localeCompare(b.itemId));
  return prisma.$transaction(async (tx) => {
    for (const e of sorted) {
      await applyMovement(tx, e.itemId, { type: "RESTOCK", quantity: e.quantity, unitCost: e.unitCost, note: note ?? "Delivery received" }, userId);
    }
    return { received: entries.length };
  });
}

export async function recentMovements(take = 12) {
  return prisma.stockMovement.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { item: { select: { name: true, unit: true } }, user: { select: { name: true } } },
  });
}
