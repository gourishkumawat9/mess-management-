import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { ItemActions } from "@/components/staff/ItemActions";
import { ExpiryBadge, StockBadge } from "@/components/staff/StockBadge";
import { MOVEMENT_LABELS, inventoryCategory, type MovementType } from "@/lib/constants";
import { formatDate, formatDateTime, formatDay, formatDays, formatQty, rupees } from "@/lib/format";
import { USAGE_WINDOW_DAYS } from "@/lib/inventory";
import { getInventoryItem } from "@/server/inventory";

export const metadata: Metadata = { title: "Inventory item" };

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const item = await getInventoryItem((await params).id);
  if (!item || item.archived) notFound();
  const { insight } = item;
  const cat = inventoryCategory(item.category);
  const dueNow = insight.status === "OUT" || insight.status === "LOW";

  const stats = [
    { label: "In stock", value: formatQty(item.quantity, item.unit), hint: `Alert at ${formatQty(item.reorderLevel, item.unit)} · full at ${formatQty(item.parLevel, item.unit)}` },
    {
      label: "Uses per day",
      value: insight.avgDailyUsage !== null ? formatQty(Math.round(insight.avgDailyUsage * 10) / 10, item.unit) : "—",
      hint: `Average of the last ${USAGE_WINDOW_DAYS} days`,
    },
    { label: "Lasts", value: formatDays(insight.daysLeft), hint: "At the current rate of use" },
    {
      label: "Restock by",
      value: dueNow ? "Now" : insight.restockBy ? formatDay(insight.restockBy) : "—",
      hint: dueNow ? "Already at or below the alert level" : "When it will hit the alert level",
    },
    {
      label: "Suggested order",
      value: insight.suggestedOrder > 0 ? formatQty(insight.suggestedOrder, item.unit) : "None",
      hint: item.costPerUnit && insight.suggestedOrder > 0 ? `About ${rupees(Math.round(insight.suggestedOrder * item.costPerUnit))}` : "Tops up to the full stock target",
    },
    {
      label: "Freshness",
      value: insight.expiresAt ? formatDate(insight.expiresAt) : "—",
      hint: item.shelfLifeDays ? `Shelf life ${item.shelfLifeDays} day${item.shelfLifeDays === 1 ? "" : "s"} from last restock` : "No shelf life set",
    },
  ];

  return (
    <div>
      <Link href="/staff/inventory" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800">
        <ArrowLeft className="h-4 w-4" /> Inventory
      </Link>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-card ring-1 ring-black/5">{cat.emoji}</span>
          <div>
            <h1 className="page-title">{item.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
              {cat.label}
              <StockBadge status={insight.status} />
              {insight.expiringSoon && <ExpiryBadge />}
            </div>
          </div>
        </div>
        <ItemActions
          item={{
            id: item.id,
            name: item.name,
            category: item.category,
            unit: item.unit,
            quantity: item.quantity,
            reorderLevel: item.reorderLevel,
            parLevel: item.parLevel,
            costPerUnit: item.costPerUnit,
            supplier: item.supplier,
            shelfLifeDays: item.shelfLifeDays,
            notes: item.notes,
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{s.label}</p>
            <p className={clsx("mt-1 text-xl font-extrabold", s.value === "Now" ? "text-red-600" : "text-zinc-900")}>{s.value}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="card mt-4 grid gap-4 p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="label">Supplier</p>
          <p className="text-zinc-800">{item.supplier ?? "—"}</p>
        </div>
        <div>
          <p className="label">Cost per {item.unit}</p>
          <p className="text-zinc-800">{item.costPerUnit != null ? rupees(item.costPerUnit) : "—"}</p>
        </div>
        <div>
          <p className="label">Last restocked</p>
          <p className="text-zinc-800">{item.lastRestockedAt ? formatDateTime(item.lastRestockedAt) : "—"}</p>
        </div>
        {item.notes && (
          <div className="sm:col-span-3">
            <p className="label">Notes</p>
            <p className="text-zinc-800">{item.notes}</p>
          </div>
        )}
      </div>

      <section className="card mt-6 overflow-hidden">
        <h2 className="border-b border-zinc-100 p-4 font-bold text-zinc-900">Stock history</h2>
        {item.movements.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-500">No stock changes recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">What</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-right">Stock after</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {item.movements.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-600">{formatDateTime(m.createdAt)}</td>
                    <td className="px-4 py-2.5 text-zinc-800">{MOVEMENT_LABELS[m.type as MovementType] ?? m.type}</td>
                    <td className={clsx("whitespace-nowrap px-4 py-2.5 text-right font-semibold", m.change > 0 ? "text-emerald-600" : "text-red-600")}>
                      {m.change > 0 ? "+" : "−"}
                      {formatQty(Math.abs(m.change), item.unit)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-zinc-800">{formatQty(m.balanceAfter, item.unit)}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{m.user?.name ?? "—"}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{m.note ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
