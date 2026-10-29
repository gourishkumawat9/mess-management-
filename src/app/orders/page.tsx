import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderStatusBadge } from "@/components/canteen/OrderStatusBadge";
import { requirePageUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { ACTIVE_STATUSES } from "@/lib/orders";
import type { OrderStatus } from "@/lib/constants";
import { listMyOrders } from "@/server/canteen";

export const metadata: Metadata = { title: "My orders" };

export default async function MyOrdersPage() {
  const user = await requirePageUser(undefined, "/orders");
  const orders = await listMyOrders(user.id);
  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus));
  const past = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status as OrderStatus));

  const OrderCard = ({ order }: { order: (typeof orders)[number] }) => (
    <Link href={`/orders/${order.id}`} className="card flex items-center gap-4 p-4 transition hover:shadow-lg">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <span className="text-[10px] font-semibold uppercase">Token</span>
        <span className="text-lg font-extrabold leading-none">{order.token}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <span className="text-xs text-zinc-500">{formatDateTime(order.createdAt)}</span>
        </div>
        <p className="mt-1.5 truncate text-sm text-zinc-700">
          {order.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-zinc-900">₹{order.total}</p>
        <ChevronRight className="ml-auto mt-1 h-4 w-4 text-zinc-400" />
      </div>
    </Link>
  );

  return (
    <main className="page max-w-3xl">
      <h1 className="page-title">My orders</h1>
      {orders.length === 0 && (
        <div className="card mt-6 p-10 text-center">
          <p className="text-5xl">🧾</p>
          <p className="mt-3 font-semibold text-zinc-900">No orders yet</p>
          <p className="text-sm text-zinc-500">Your canteen orders will show up here.</p>
          <Link href="/" className="btn-primary mt-5">
            Order something
          </Link>
        </div>
      )}
      {active.length > 0 && (
        <section className="mt-6">
          <h2 className="label">In progress</h2>
          <div className="space-y-3">
            {active.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="label">Past orders</h2>
          <div className="space-y-3">
            {past.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
