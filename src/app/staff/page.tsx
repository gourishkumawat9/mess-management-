import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, ClipboardList, IndianRupee, TriangleAlert } from "lucide-react";
import { CanteenToggle } from "@/components/staff/CanteenToggle";
import { ExpiryBadge, StockBadge } from "@/components/staff/StockBadge";
import { requirePageUser } from "@/lib/auth";
import { MOVEMENT_LABELS, inventoryCategory, type MovementType } from "@/lib/constants";
import { formatDate, formatDays, formatQty, formatWhen } from "@/lib/format";
import { getCanteenSettings } from "@/server/canteen";
import { getDashboard } from "@/server/dashboard";

export const metadata: Metadata = { title: "Staff dashboard" };

export default async function StaffDashboard() {
  const user = await requirePageUser(["STAFF", "ADMIN"], "/staff");
  const [data, settings] = await Promise.all([getDashboard(), getCanteenSettings()]);
  const now = new Date();

  const tiles = [
    {
      label: "Need restocking",
      value: data.inventory.out + data.inventory.low,
      hint: `${data.inventory.out} out of stock · ${data.inventory.low} low`,
      Icon: TriangleAlert,
      tone: "text-red-600 bg-red-50",
      href: "/staff/inventory/restock",
    },
    {
      label: "Restock by tomorrow",
      value: data.inventory.soon,
      hint: `of ${data.inventory.total} items tracked`,
      Icon: Boxes,
      tone: "text-amber-700 bg-amber-50",
      href: "/staff/inventory?filter=restock",
    },
    {
      label: "Canteen orders today",
      value: data.orders.today,
      hint: `${data.orders.active} in progress right now`,
      Icon: ClipboardList,
      tone: "text-sky-700 bg-sky-50",
      href: "/staff/orders",
    },
    {
      label: "Canteen sales today",
      value: `₹${data.orders.revenue.toLocaleString("en-IN")}`,
      hint: "Excludes cancelled orders",
      Icon: IndianRupee,
      tone: "text-emerald-700 bg-emerald-50",
      href: "/staff/orders",
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">{formatDate(now)}</p>
          <h1 className="page-title">Hello, {user.name.split(" ")[0]}</h1>
        </div>
        <CanteenToggle open={settings.open} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, hint, Icon, tone, href }) => (
          <Link key={label} href={href} className="card p-4 transition hover:shadow-lg">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-extrabold text-zinc-900">{value}</p>
            <p className="text-sm font-medium text-zinc-700">{label}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-100 p-4">
            <h2 className="font-bold text-zinc-900">Restock alerts</h2>
            <Link href="/staff/inventory/restock" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Restock list <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {data.inventory.alerts.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">All stocked up. Nothing needs reordering. 🎉</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {data.inventory.alerts.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <Link href={`/staff/inventory/${item.id}`} className="flex items-center gap-3 p-4 hover:bg-zinc-50">
                    <span className="text-2xl">{inventoryCategory(item.category).emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        {formatQty(item.quantity, item.unit)} left · lasts {formatDays(item.insight.daysLeft)}
                        {item.insight.suggestedOrder > 0 && <> · order {formatQty(item.insight.suggestedOrder, item.unit)}</>}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StockBadge status={item.insight.status} />
                      {item.insight.expiringSoon && <ExpiryBadge />}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-zinc-900">Top sellers today</h2>
              <Link href="/staff/orders" className="text-sm font-semibold text-brand-600">
                Live orders
              </Link>
            </div>
            {data.orders.topItems.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No canteen orders yet today.</p>
            ) : (
              <ol className="mt-3 space-y-2">
                {data.orders.topItems.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-zinc-800">{t.name}</span>
                    <span className="font-semibold text-zinc-900">{t.quantity}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section className="card p-4">
            <h2 className="font-bold text-zinc-900">Recent stock updates</h2>
            {data.movements.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No stock updates yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data.movements.map((m) => (
                  <li key={m.id} className="flex items-start gap-3 text-sm">
                    <span className={`mt-0.5 font-bold ${m.change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {m.change > 0 ? "+" : "−"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-zinc-800">
                        <b>{formatQty(Math.abs(m.change), m.item.unit)}</b> {m.item.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {MOVEMENT_LABELS[m.type as MovementType] ?? m.type} · {formatWhen(m.createdAt, now)}
                        {m.user ? ` · ${m.user.name}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
