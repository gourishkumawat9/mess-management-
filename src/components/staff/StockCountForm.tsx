"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { CircleCheck } from "lucide-react";
import { api } from "@/lib/client";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import { formatQty } from "@/lib/format";

interface CountRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
}

/**
 * End-of-day physical count. Staff type what is actually on the shelf; any
 * drop is saved as usage, so the "days left" estimates stay accurate.
 */
export function StockCountForm({ items }: { items: CountRow[] }) {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [category, setCategory] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const groups = useMemo(
    () =>
      INVENTORY_CATEGORIES.map((c) => ({ ...c, items: items.filter((i) => i.category === c.id) })).filter(
        (g) => g.items.length > 0 && (category === "all" || g.id === category),
      ),
    [items, category],
  );

  const entries = Object.entries(counts)
    .filter(([, v]) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0)
    .map(([itemId, v]) => ({ itemId, counted: Number(v) }));
  const changed = entries.filter((e) => {
    const item = items.find((i) => i.id === e.itemId);
    return item && Math.abs(item.quantity - e.counted) > 1e-9;
  });

  async function submit() {
    if (changed.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api<{ changed: number }>("/api/inventory/count", { body: { entries: changed } });
      setCounts({});
      setMessage({ ok: true, text: `Saved. ${res.changed} item${res.changed === 1 ? "" : "s"} updated.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save the count" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Daily stock count</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            At the end of the day, enter what is actually left. Leave a box empty if it hasn&apos;t changed. Anything lower than the
            system figure is saved as the day&apos;s usage.
          </p>
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input sm:w-56" aria-label="Category">
          <option value="all">All categories</option>
          {INVENTORY_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {groups.map((g) => (
          <section key={g.id} className="card overflow-hidden">
            <h2 className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 font-bold text-zinc-900">
              <span>{g.emoji}</span> {g.label}
            </h2>
            <ul className="divide-y divide-zinc-100">
              {g.items.map((item) => {
                const value = counts[item.id] ?? "";
                const diff = value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) - item.quantity : null;
                return (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">System: {formatQty(item.quantity, item.unit)}</p>
                    </div>
                    {diff !== null && Math.abs(diff) > 1e-9 && (
                      <span className={clsx("text-xs font-semibold", diff < 0 ? "text-red-600" : "text-emerald-600")}>
                        {diff < 0 ? "used " : "+"}
                        {formatQty(Math.abs(diff), item.unit)}
                      </span>
                    )}
                    <div className="relative w-32">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={value}
                        onChange={(e) => setCounts((c) => ({ ...c, [item.id]: e.target.value }))}
                        className="input pr-12 text-right"
                        placeholder={formatQty(item.quantity)}
                        aria-label={`Counted ${item.name} in ${item.unit}`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{item.unit}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 mt-6 flex flex-col items-stretch gap-2 rounded-2xl bg-white/95 p-3 shadow-xl ring-1 ring-black/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        {message ? (
          <p className={clsx("flex items-center gap-2 px-2 text-sm font-medium", message.ok ? "text-emerald-700" : "text-red-700")}>
            {message.ok && <CircleCheck className="h-4 w-4" />} {message.text}
          </p>
        ) : (
          <p className="px-2 text-sm text-zinc-600">
            {changed.length === 0 ? "No changes entered yet" : `${changed.length} item${changed.length === 1 ? "" : "s"} will be updated`}
          </p>
        )}
        <button onClick={submit} disabled={saving || changed.length === 0} className="btn-primary">
          {saving ? "Saving…" : "Save count"}
        </button>
      </div>
    </div>
  );
}
