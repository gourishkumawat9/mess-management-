import type { Metadata } from "next";
import Link from "next/link";
import { Bike, ClipboardList, IndianRupee } from "lucide-react";
import { CanteenToggle } from "@/components/staff/CanteenToggle";
import { requirePageUser } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { getCanteenSettings } from "@/server/canteen";
import { getDashboard } from "@/server/dashboard";
import { reveal } from "@/components/motion/revealProps";
import { PHOTOS, photoUrl } from "@/lib/photos";

export const metadata: Metadata = { title: "Staff dashboard" };

export default async function StaffDashboard() {
  const user = await requirePageUser(STAFF_ROLES, "/staff");
  const [data, settings] = await Promise.all([getDashboard(), getCanteenSettings()]);
  const now = new Date();
  const owner = user.role === "ADMIN";
  const heading = owner ? "Owner dashboard" : "Canteen dashboard";
  const banner = owner ? PHOTOS.pots : PHOTOS.kitchen;

  const tiles = [
    {
      label: "Canteen orders today",
      value: data.orders.today,
      hint: `${data.orders.active} in progress right now`,
      Icon: ClipboardList,
      tone: "text-white bg-brand-600",
      href: "/staff/orders",
    },
    {
      label: "Deliveries in progress",
      value: data.orders.activeDeliveries,
      hint: "To hostel rooms",
      Icon: Bike,
      tone: "text-brand-800 bg-brand-100",
      href: "/staff/orders",
    },
    {
      label: "Canteen sales today",
      value: `₹${data.orders.revenue.toLocaleString("en-IN")}`,
      hint: "Excludes cancelled and unpaid online orders",
      Icon: IndianRupee,
      tone: "text-ink bg-gold-400",
      href: "/staff/orders",
    },
  ];

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-ink bg-brand-600 text-white shadow-hard-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoUrl(banner, 1400, 500)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-700 via-brand-600/80 to-transparent" />
        <div aria-hidden className="absolute -right-6 -top-10 font-display text-[10rem] uppercase leading-none text-white/10">{owner ? "Owner" : "Canteen"}</div>
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-9">
          <div>
            <p className="eyebrow !text-gold-300 !tracking-[0.25em]">
              {heading} · {formatDate(now)}
            </p>
            <p className="scribble mt-3 text-2xl text-gold-300">hey there,</p>
            <h1 className="display text-6xl sm:text-7xl">{user.name.split(" ")[0]}</h1>
          </div>
          <CanteenToggle open={settings.switchOn} hours={settings.hours} inHours={settings.inHours} />
        </div>
      </div>

      <div className={`mt-6 grid grid-cols-2 gap-3 ${tiles.length > 3 ? "lg:grid-cols-4" : tiles.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {tiles.map(({ label, value, hint, Icon, tone, href }, i) => (
          <Link key={label} href={href} {...reveal("up", i * 90)} className="card card-hover group p-5">
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink transition duration-500 group-hover:-rotate-6 group-hover:scale-110 ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-5xl leading-none text-ink">{value}</p>
            <p className="text-sm font-semibold text-zinc-700">{label}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-3">
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
              <ol className="mt-3 grid gap-x-10 gap-y-2 sm:grid-cols-2">
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
        </div>
      </div>
    </div>
  );
}
