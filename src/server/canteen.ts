import "server-only";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/api";
import type { CurrentUser } from "@/lib/auth";
import {
  DEFAULT_CANTEEN_HOURS,
  MAX_ACTIVE_ORDERS_PER_USER,
  SETTINGS,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/constants";
import {
  ACTIVE_STATUSES,
  canTransition,
  customerCanCancel,
  orderTotal,
  startOfDayIST,
  statusTimestampField,
} from "@/lib/orders";

// ---------------------------------------------------------------- settings

export async function getCanteenSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [SETTINGS.canteenOpen, SETTINGS.canteenHours] } },
  });
  const value = (key: string) => rows.find((r) => r.key === key)?.value;
  return {
    open: value(SETTINGS.canteenOpen) !== "false",
    hours: value(SETTINGS.canteenHours) ?? DEFAULT_CANTEEN_HOURS,
  };
}

export async function updateCanteenSettings(input: { canteenOpen?: boolean; canteenHours?: string }) {
  const writes = [];
  if (input.canteenOpen !== undefined) {
    const value = String(input.canteenOpen);
    writes.push(
      prisma.setting.upsert({
        where: { key: SETTINGS.canteenOpen },
        create: { key: SETTINGS.canteenOpen, value },
        update: { value },
      }),
    );
  }
  if (input.canteenHours !== undefined) {
    const value = input.canteenHours;
    writes.push(
      prisma.setting.upsert({
        where: { key: SETTINGS.canteenHours },
        create: { key: SETTINGS.canteenHours, value },
        update: { value },
      }),
    );
  }
  await prisma.$transaction(writes);
  return getCanteenSettings();
}

// -------------------------------------------------------------------- menu

export async function getMenu({ includeArchived = false } = {}) {
  return prisma.menuCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        where: includeArchived ? {} : { archived: false },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export type MenuCategoryWithItems = Awaited<ReturnType<typeof getMenu>>[number];
export type MenuItemRow = MenuCategoryWithItems["items"][number];

// ------------------------------------------------------------------ orders

const orderInclude = {
  items: true,
  user: { select: { name: true, phone: true, email: true } },
} as const;

export async function placeOrder(
  user: CurrentUser,
  input: { items: { menuItemId: string; quantity: number }[]; paymentMethod: PaymentMethod; note: string | null },
) {
  const settings = await getCanteenSettings();
  if (!settings.open) throw new HttpError(409, "The canteen is closed right now");

  // Merge duplicate lines for the same dish.
  const quantities = new Map<string, number>();
  for (const line of input.items) {
    quantities.set(line.menuItemId, (quantities.get(line.menuItemId) ?? 0) + line.quantity);
  }

  const dishes = await prisma.menuItem.findMany({ where: { id: { in: [...quantities.keys()] } } });
  const lines = [...quantities.entries()].map(([menuItemId, quantity]) => {
    const dish = dishes.find((d) => d.id === menuItemId);
    if (!dish || dish.archived) throw new HttpError(400, "An item in your cart is no longer on the menu");
    if (!dish.isAvailable) throw new HttpError(409, `${dish.name} is not available right now`);
    return { menuItemId, quantity, name: dish.name, price: dish.price, isVeg: dish.isVeg };
  });

  const active = await prisma.order.count({ where: { userId: user.id, status: { in: ACTIVE_STATUSES } } });
  if (active >= MAX_ACTIVE_ORDERS_PER_USER) {
    throw new HttpError(429, `You already have ${active} orders in progress. Please collect them first.`);
  }

  // SQLite serialises write transactions, so the daily token count is safe here.
  return prisma.$transaction(async (tx) => {
    const today = await tx.order.count({ where: { createdAt: { gte: startOfDayIST(new Date()) } } });
    return tx.order.create({
      data: {
        token: today + 1,
        userId: user.id,
        total: orderTotal(lines),
        paymentMethod: input.paymentMethod,
        note: input.note,
        items: { create: lines },
      },
      include: orderInclude,
    });
  });
}

export async function listMyOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });
}

/** An order the given user is allowed to see: their own, or any for staff. */
export async function getOrderFor(user: CurrentUser, id: string) {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) return null;
  const staff = user.role === "STAFF" || user.role === "ADMIN";
  if (order.userId !== user.id && !staff) return null;
  return order;
}

export async function cancelByCustomer(user: CurrentUser, id: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) throw new HttpError(404, "Order not found");
  if (!customerCanCancel(order.status as OrderStatus)) {
    throw new HttpError(409, "The canteen has already started on this order. Please speak to the counter.");
  }
  const updated = await prisma.order.updateMany({
    where: { id, status: "PLACED" },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Cancelled by customer" },
  });
  if (updated.count === 0) throw new HttpError(409, "This order can no longer be cancelled");
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}

/** Live queue for the counter: active orders plus today's finished ones. */
export async function listStaffOrders(now = new Date()) {
  const [active, done] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: "asc" },
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: { status: { in: ["COMPLETED", "CANCELLED"] }, createdAt: { gte: startOfDayIST(now) } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: orderInclude,
    }),
  ]);
  return { active, done };
}

export async function updateOrderByStaff(
  id: string,
  input: { status?: OrderStatus; isPaid?: boolean; cancelReason?: string | null },
) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new HttpError(404, "Order not found");

  const data: Record<string, unknown> = {};
  if (input.isPaid !== undefined) data.isPaid = input.isPaid;
  if (input.status && input.status !== order.status) {
    if (!canTransition(order.status as OrderStatus, input.status)) {
      throw new HttpError(409, `Can't move an order from ${order.status} to ${input.status}`);
    }
    data.status = input.status;
    const stamp = statusTimestampField(input.status);
    if (stamp) data[stamp] = new Date();
    if (input.status === "CANCELLED") data.cancelReason = input.cancelReason ?? "Cancelled by canteen";
  }

  // Guard on the status we read, so two staff tapping at once can't skip a step.
  const result = await prisma.order.updateMany({ where: { id, status: order.status }, data });
  if (result.count === 0) throw new HttpError(409, "This order was just updated by someone else. Refresh and try again.");
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}
