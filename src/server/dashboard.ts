import "server-only";
import { prisma } from "@/lib/db";
import { ACTIVE_STATUSES, startOfDayIST } from "@/lib/orders";

/** Figures for the staff dashboard. */
export async function getDashboard(now = new Date()) {
  const since = startOfDayIST(now);
  const [todaysOrders, activeOrders, activeDeliveries, topItems] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: since }, status: { in: [...ACTIVE_STATUSES, "COMPLETED"] } },
      select: { total: true },
    }),
    prisma.order.count({ where: { status: { in: ACTIVE_STATUSES } } }),
    prisma.order.count({ where: { status: { in: ACTIVE_STATUSES }, fulfilment: "DELIVERY" } }),
    prisma.orderItem.groupBy({
      by: ["name"],
      where: { order: { createdAt: { gte: since }, status: { in: [...ACTIVE_STATUSES, "COMPLETED"] } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  return {
    orders: {
      today: todaysOrders.length,
      revenue: todaysOrders.reduce((s, o) => s + o.total, 0),
      active: activeOrders,
      activeDeliveries,
      topItems: topItems.map((t) => ({ name: t.name, quantity: t._sum.quantity ?? 0 })),
    },
  };
}
