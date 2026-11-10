import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bike, Boxes, ClipboardList, IndianRupee, TriangleAlert } from "lucide-react";
import { CanteenToggle } from "@/components/staff/CanteenToggle";
import { ExpiryBadge, StockBadge } from "@/components/staff/StockBadge";
import { requirePageUser } from "@/lib/auth";
import {
  CANTEEN_ROLES,
  MESS_ROLES,
  MOVEMENT_LABELS,
  STAFF_ROLES,
  hasRole,
  inventoryCategory,
  type MovementType,
} from "@/lib/constants";
import { formatDate, formatDays, formatQty, formatWhen } from "@/lib/format";
import { getCanteenSettings } from "@/server/canteen";
import { getDashboard } from "@/server/dashboard";
import { reveal } from "@/components/motion/revealProps";
import { PHOTOS, photoUrl } from "@/lib/photos";

export const metadata: Metadata = { title: "Staff dashboard" };

export default async function StaffDashboard() {
  const user = await requirePageUser(STAFF_ROLES, "/staff");
  // One dashboard per team: canteen staff see the canteen, mess kitchen staff
  // see the mess, and the owner (and combined staff) see both.
  const canteen = hasRole(user.role, CANTEEN_ROLES);
  const mess = hasRole(user.role, MESS_ROLES);
  const [data, settings] = await Promise.all([getDashboard({ canteen, mess }), getCanteenSettings()]);
  const now = new Date();
  const heading = canteen && mess ? (user.role === "ADMIN" ? "Owner dashboard" : "Canteen & mess") : canteen ? "Canteen dashboard" : "Mess kitchen dashboard";

  const banner = canteen && mess ? PHOTOS.pots : canteen ? PHOTOS.kitchen : PHOTOS.vegetables;

  const tiles = [
    {
      label: "Need restocking",
      value: data.inventory.out + data.inventory.low,
      hint: `${data.inventory.out} out of stock · ${data.inventory.low} low`,
      Icon: TriangleAlert,
      tone: "text-white bg-brand-600",
      href: "/staff/inventory/restock",
      show: mess,
    },
    {
      label: "Restock by tomorrow",
      value: data.inventory.soon,
      hint: `of ${data.inventory.total} items tracked`,
      Icon: Boxes,
      tone: "text-ink bg-gold-400",
      href: "/staff/inventory?filter=restock",
      show: mess,
    },
    {
      label: "Canteen orders today",
      value: data.orders.today,
      hint: `${data.orders.active} in progress right now`,
      Icon: ClipboardList,
      tone: "text-white bg-brand-600",
      href: "/staff/orders",
      show: canteen,
    },
    {
      label: "Deliveries in progress",
      value: data.orders.activeDeliveries,
      hint: "To hostel rooms",
      Icon: Bike,
      tone: "text-brand-800 bg-brand-100",
      href: "/staff/orders",
      show: canteen && !mess,
    },
    {
      label: "Canteen sales today",
      value: `₹${data.orders.revenue.toLocaleString("en-IN")}`,
      hint: "Excludes cancelled orders",
      Icon: IndianRupee,
      tone: "text-ink bg-gold-400",
      href: "/staff/orders",
      show: canteen,
    },
  ].filter((t) => t.show);

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-950 text-white shadow-lift">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(banner, 1400, 500)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/80 to-brand-900/30" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-9">
          <div>
            <p className="eyebrow !text-gold-300">
              {heading} · {formatDate(now)}
            </p>
            <h1 className="display mt-3 text-4xl sm:text-5xl">Hello, {user.name.split(" ")[0]}</h1>
          </div>
          {canteen && (
            <CanteenToggle open={settings.open} />
          )}
        </div>
      </div>

      <div className={`mt-6 grid grid-cols-2 gap-3 ${tiles.length > 3 ? "lg:grid-cols-4" : tiles.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {tiles.map(({ label, value, hint, Icon, tone, href }, i) => (
          <Link key={label} href={href} {...reveal("up", i * 90)} className="card card-hover group p-5">
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl transition duration-500 group-hover:-rotate-6 group-hover:scale-110 ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink">{value}</p>
            <p className="text-sm font-semibold text-zinc-700">{label}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {mess && (
        <section {...reveal("up")} className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-brand-950/5 p-5">
            <h2 className="text-xl font-extrabold tracking-tight text-ink">Restock alerts</h2>
            <Link href="/staff/inventory/restock" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
              Restock list <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {data.inventory.alerts.length === 0 ? (
            <p className="p-8 text-center text-sm text-zinc-500">All stocked up. Nothing needs reordering.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {data.inventory.alerts.slice(0, 10).map((item) => (
                <li key={item.id}>
                  <Link href={`/staff/inventory/${item.id}`} className="flex items-center gap-3 p-4 transition hover:bg-cream-100">
                    <span className="text-2xl">{inventoryCategory(item.category).emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{item.name}</p>
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
        )}

        <div className={mess ? "space-y-6" : "space-y-6 xl:col-span-3"}>
          {canteen && (
          <section {...reveal("up", 100)} className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold tracking-tight text-ink">Top sellers today</h2>
              <Link href="/staff/orders" className="text-sm font-semibold text-brand-600">
                Live orders
              </Link>
            </div>
            {data.orders.topItems.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No canteen orders yet today.</p>
            ) : (
              <ol className={mess ? "mt-3 space-y-2" : "mt-3 grid gap-x-10 gap-y-2 sm:grid-cols-2"}>
                {data.orders.topItems.map((t, i) => (
                  <li key={t.name} className="flex items-center gap-3 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 font-display text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-zinc-800">{t.name}</span>
                    <span className="font-semibold text-ink">{t.quantity}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          )}

          {mess && (
          <section {...reveal("up", 160)} className="card p-5">
            <h2 className="text-xl font-extrabold tracking-tight text-ink">Recent stock updates</h2>
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
          )}
        </div>
      </div>
    </div>
  );
}
