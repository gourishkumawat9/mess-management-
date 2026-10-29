import "server-only";
import { prisma } from "@/lib/db";
import { ACTIVE_STATUSES, startOfDayIST } from "@/lib/orders";
import { listInventory, recentMovements } from "./inventory";

export async function getDashboard(now = new Date()) {
  const since = startOfDayIST(now);
  const [inventory, todaysOrders, activeOrders, movements, topItems] = await Promise.all([
    listInventory(now),
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      select: { total: true },
    }),
    prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    recentMovements(8),
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
      topItems: topItems.map((t) => ({ name: t.name, quantity: t._sum.quantity ?? 0 })),
    },
    movements,
  };
}
