import "server-only";
import { prisma } from "@/lib/db";
import { ACTIVE_STATUSES, startOfDayIST } from "@/lib/orders";
import { listInventory, recentMovements } from "./inventory";

/** Figures for the staff dashboard. Each team only loads its own half. */
export async function getDashboard({ canteen = true, mess = true } = {}, now = new Date()) {
  const since = startOfDayIST(now);
  const [inventory, todaysOrders, activeOrders, activeDeliveries, movements, topItems] = await Promise.all([
    mess ? listInventory(now) : Promise.resolve([] as Awaited<ReturnType<typeof listInventory>>),
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.order.count({ where: { status: { in: ACTIVE_STATUSES }, fulfilment: "DELIVERY" } }),
    mess ? recentMovements(8) : Promise.resolve([] as Awaited<ReturnType<typeof recentMovements>>),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { createdAt: { gte: since }, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const alerts = inventory.filter((i) => i.insight.status !== "OK" || i.insight.expiringSoon);
  return {
    inventory: {
      total: inventory.length,
      out: inventory.filter((i) => i.insight.status === "OUT").length,
      low: inventory.filter((i) => i.insight.status === "LOW").length,
      soon: inventory.filter((i) => i.insight.status === "RUNNING_OUT").length,
      alerts,
    },
    orders: {
      today: todaysOrders.length,
      revenue: todaysOrders.reduce((s, o) => s + o.total, 0),
      active: activeOrders,
      activeDeliveries,
      topItems: topItems.map((t) => ({ name: t.name, quantity: t._sum.quantity ?? 0 })),
    },
    movements,
  };
}
