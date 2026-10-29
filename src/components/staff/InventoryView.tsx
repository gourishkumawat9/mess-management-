"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { ClipboardCheck, Plus, Search, Truck } from "lucide-react";
import { INVENTORY_CATEGORIES, inventoryCategory } from "@/lib/constants";
import { formatDay, formatDays, formatQty } from "@/lib/format";
import type { StockStatus } from "@/lib/inventory";
import { ItemForm } from "./ItemForm";
import { ExpiryBadge, StockBadge } from "./StockBadge";
import { StockUpdateDialog, type StockTarget } from "./StockUpdateDialog";

export interface InventoryRowData {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  parLevel: number;
  costPerUnit: number | null;
  supplier: string | null;
  insight: {
    status: StockStatus;
    avgDailyUsage: number | null;
    daysLeft: number | null;
    restockBy: string | null;
    suggestedOrder: number;
    expiringSoon: boolean;
  };
}

const FILTERS = [
  { id: "all", label: "All items" },
  { id: "restock", label: "Needs restock" },
  { id: "OUT", label: "Out of stock" },
  { id: "LOW", label: "Low" },
  { id: "RUNNING_OUT", label: "Restock soon" },
  { id: "fresh", label: "Check freshness" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"];

const BAR: Record<StockStatus, string> = {
  OUT: "bg-red-600",
  LOW: "bg-red-500",
  RUNNING_OUT: "bg-amber-500",
  OK: "bg-emerald-500",
};

function matches(row: InventoryRowData, filter: FilterId) {
  switch (filter) {
    case "all":
      return true;
    case "restock":
      return row.insight.status !== "OK";
    case "fresh":
      return row.insight.expiringSoon;
    default:
      return row.insight.status === filter;
  }
}

export function InventoryView({ items, initialFilter }: { items: InventoryRowData[]; initialFilter?: string }) {
  const [filter, setFilter] = useState<FilterId>(
    FILTERS.some((f) => f.id === initialFilter) ? (initialFilter as FilterId) : "all",
  );
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [updating, setUpdating] = useState<StockTarget | null>(null);
  const [adding, setAdding] = useState(false);

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, items.filter((i) => matches(i, f.id)).length])) as Record<FilterId, number>,
    [items],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        matches(i, filter) &&
        (category === "all" || i.category === category) &&
        (!q || i.name.toLowerCase().includes(q) || i.supplier?.toLowerCase().includes(q)),
    );
  }, [items, filter, category, query]);

  const fill = (r: InventoryRowData) => {
    const target = r.parLevel > 0 ? r.parLevel : Math.max(r.reorderLevel * 2, r.quantity, 1);
    return Math.max(2, Math.min(100, (r.quantity / target) * 100));
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Mess inventory</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {items.length} items tracked · <b className="text-red-600">{counts.restock}</b> need restocking
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/staff/inventory/count" className="btn-secondary">
            <ClipboardCheck className="h-4 w-4" /> Daily count
          </Link>
          <Link href="/staff/inventory/restock" className="btn-secondary">
            <Truck className="h-4 w-4" /> Restock list
          </Link>
          <button onClick={() => setAdding(true)} className="btn-primary">
            <Plus className="h-4 w-4" /> Add item
          </button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={clsx("chip", filter === f.id && "chip-active")}>
            {f.label}
            <span className="rounded-full bg-zinc-100 px-1.5 text-xs text-zinc-600">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items or suppliers" className="input pl-9" aria-label="Search inventory" />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input sm:w-56" aria-label="Category">
          <option value="all">All categories</option>
          {INVENTORY_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-4 p-10 text-center text-sm text-zinc-500">No items match these filters.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card mt-4 hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">In stock</th>
                  <th className="px-4 py-3">Uses / day</th>
                  <th className="px-4 py-3">Lasts</th>
                  <th className="px-4 py-3">Restock by</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/staff/inventory/${r.id}`} className="flex items-center gap-3">
                        <span className="text-xl">{inventoryCategory(r.category).emoji}</span>
                        <span>
                          <span className="block font-semibold text-zinc-900 hover:text-brand-700">{r.name}</span>
                          <span className="block text-xs text-zinc-500">{inventoryCategory(r.category).label}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-900">{formatQty(r.quantity, r.unit)}</p>
                      <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-zinc-100">
                        <div className={clsx("h-full rounded-full", BAR[r.insight.status])} style={{ width: `${fill(r)}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {r.insight.avgDailyUsage !== null ? formatQty(Math.round(r.insight.avgDailyUsage * 10) / 10, r.unit) : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{formatDays(r.insight.daysLeft)}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {r.insight.status === "OUT" || r.insight.status === "LOW" ? (
                        <span className="font-semibold text-red-600">Now</span>
                      ) : r.insight.restockBy ? (
                        <span suppressHydrationWarning>{formatDay(r.insight.restockBy)}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StockBadge status={r.insight.status} />
                        {r.insight.expiringSoon && <ExpiryBadge />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setUpdating(r)} className="btn-secondary btn-sm">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 space-y-3 md:hidden">
            {rows.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{inventoryCategory(r.category).emoji}</span>
                  <Link href={`/staff/inventory/${r.id}`} className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-900">{r.name}</p>
                    <p className="text-sm text-zinc-600">
                      {formatQty(r.quantity, r.unit)} · lasts {formatDays(r.insight.daysLeft)}
                    </p>
                  </Link>
                  <div className="flex flex-col items-end gap-1">
                    <StockBadge status={r.insight.status} />
                    {r.insight.expiringSoon && <ExpiryBadge />}
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div className={clsx("h-full rounded-full", BAR[r.insight.status])} style={{ width: `${fill(r)}%` }} />
                </div>
                <button onClick={() => setUpdating(r)} className="btn-secondary btn-sm mt-3 w-full">
                  Update stock
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <StockUpdateDialog item={updating} onClose={() => setUpdating(null)} />
      {adding && <ItemForm open onClose={() => setAdding(false)} />}
    </div>
  );
}
