// Pure stock calculations: no database access, so they are easy to unit test.

export type StockStatus = "OUT" | "LOW" | "RUNNING_OUT" | "OK";

export const USAGE_WINDOW_DAYS = 14;
/** Items expected to reach their reorder level within this many days are flagged ("restock by tomorrow"). */
export const RESTOCK_LEAD_DAYS = 1;

const DAY_MS = 24 * 60 * 60 * 1000;
/** Perishables are flagged for a freshness check this close to their use-by time. */
export const FRESHNESS_WARNING_MS = 12 * 60 * 60 * 1000;

export const STATUS_META: Record<StockStatus, { label: string; rank: number }> = {
  OUT: { label: "Out of stock", rank: 0 },
  LOW: { label: "Low stock", rank: 1 },
  RUNNING_OUT: { label: "Restock soon", rank: 2 },
  OK: { label: "In stock", rank: 3 },
};

export interface StockItemInput {
  quantity: number;
  reorderLevel: number;
  parLevel: number;
  shelfLifeDays: number | null;
  lastRestockedAt: Date | null;
  createdAt: Date;
}

export interface MovementSample {
  type: string;
  change: number;
  createdAt: Date;
}

export interface StockInsight {
  status: StockStatus;
  avgDailyUsage: number | null;
  daysLeft: number | null;
  restockBy: Date | null;
  suggestedOrder: number;
  expiresAt: Date | null;
  expiringSoon: boolean;
}

/**
 * Average daily consumption (usage + wastage) over the last USAGE_WINDOW_DAYS.
 * Items tracked for less than the full window are averaged over the days they
 * have existed, so a new item is not under-estimated. Returns null when there
 * is no consumption on record.
 */
export function averageDailyUsage(movements: MovementSample[], trackedSince: Date, now: Date): number | null {
  const windowStart = now.getTime() - USAGE_WINDOW_DAYS * DAY_MS;
  let consumed = 0;
  for (const m of movements) {
    if ((m.type === "USAGE" || m.type === "WASTAGE") && m.change < 0 && m.createdAt.getTime() >= windowStart) {
      consumed += -m.change;
    }
  }
  if (consumed <= 0) return null;
  const trackedDays = (now.getTime() - Math.max(trackedSince.getTime(), windowStart)) / DAY_MS;
  const days = Math.min(USAGE_WINDOW_DAYS, Math.max(1, trackedDays));
  return consumed / days;
}

export function stockInsight(item: StockItemInput, avgDailyUsage: number | null, now: Date): StockInsight {
  const usage = avgDailyUsage && avgDailyUsage > 0 ? avgDailyUsage : null;
  const daysLeft = usage ? item.quantity / usage : null;
  const daysUntilReorder = usage ? Math.max(0, (item.quantity - item.reorderLevel) / usage) : null;

  let status: StockStatus = "OK";
  if (item.quantity <= 0) status = "OUT";
  else if (item.quantity <= item.reorderLevel) status = "LOW";
  else if (daysUntilReorder !== null && daysUntilReorder <= RESTOCK_LEAD_DAYS) status = "RUNNING_OUT";

  let restockBy: Date | null = null;
  if (item.quantity <= item.reorderLevel) restockBy = now;
  else if (daysUntilReorder !== null) restockBy = new Date(now.getTime() + daysUntilReorder * DAY_MS);

  const target = item.parLevel > 0 ? item.parLevel : item.reorderLevel * 2;
  const suggestedOrder = Math.max(0, Math.ceil(target - item.quantity));

  const expiresAt =
    item.shelfLifeDays && item.lastRestockedAt
      ? new Date(item.lastRestockedAt.getTime() + item.shelfLifeDays * DAY_MS)
      : null;
  const expiringSoon = !!expiresAt && item.quantity > 0 && expiresAt.getTime() - now.getTime() <= FRESHNESS_WARNING_MS;

  return { status, avgDailyUsage: usage, daysLeft, restockBy, suggestedOrder, expiresAt, expiringSoon };
}

/** Rounds away floating point noise from repeated additions (0.1 + 0.2). */
export function roundQty(n: number) {
  return Math.round(n * 1000) / 1000;
}
