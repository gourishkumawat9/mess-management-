"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { CircleCheck, Printer } from "lucide-react";
import { api } from "@/lib/client";
import { INVENTORY_CATEGORIES } from "@/lib/constants";
import { formatDate, formatDays, formatQty, rupees } from "@/lib/format";
import type { InventoryRowData } from "./InventoryView";
import { StockBadge } from "./StockBadge";

/** Shopping list for the supplier run, which doubles as the delivery check-in form. */
export function RestockList({ items, generatedAt }: { items: InventoryRowData[]; generatedAt: string }) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [qty, setQty] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.insight.suggestedOrder > 0 ? String(i.insight.suggestedOrder) : ""])),
  );
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const visible = useMemo(() => items.filter((i) => showAll || i.insight.status !== "OK"), [items, showAll]);
  const groups = INVENTORY_CATEGORIES.map((c) => ({ ...c, items: visible.filter((i) => i.category === c.id) })).filter(
    (g) => g.items.length > 0,
  );

  const estimate = visible.reduce((sum, i) => {
    const q = Number(qty[i.id] || 0);
    return sum + (i.costPerUnit ? q * i.costPerUnit : 0);
  }, 0);

  const toReceive = visible.filter((i) => picked[i.id] && Number(qty[i.id]) > 0);

  async function receive() {
    if (toReceive.length === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      await api("/api/inventory/deliveries", {
        body: { entries: toReceive.map((i) => ({ itemId: i.id, quantity: Number(qty[i.id]), unitCost: i.costPerUnit })) },
      });
      setPicked({});
      setMessage({ ok: true, text: `Delivery saved for ${toReceive.length} item${toReceive.length === 1 ? "" : "s"}.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Could not save the delivery" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Restock list</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Suggested quantities top each item up to its full stock target. Prepared {formatDate(generatedAt)}.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <label className="chip cursor-pointer">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-brand-600" />
            Show all items
          </label>
          <button onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="text-4xl">✅</p>
          <p className="mt-2 font-semibold text-zinc-900">Nothing needs restocking right now</p>
          <p className="text-sm text-zinc-500">Tick “Show all items” to order something anyway.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {groups.map((g) => (
            <section key={g.id} className="card overflow-hidden print:shadow-none print:ring-0">
              <h2 className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3 font-bold text-zinc-900">
                <span>{g.emoji}</span> {g.label}
              </h2>
              <ul className="divide-y divide-zinc-100">
                {g.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!!picked[item.id]}
                      onChange={(e) => setPicked((p) => ({ ...p, [item.id]: e.target.checked }))}
                      className="h-5 w-5 accent-brand-600 print:hidden"
                      aria-label={`Received ${item.name}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-zinc-900">{item.name}</p>
                      <p className="text-xs text-zinc-500">
                        Have {formatQty(item.quantity, item.unit)} · lasts {formatDays(item.insight.daysLeft)}
                        {item.supplier ? ` · ${item.supplier}` : ""}
                      </p>
                    </div>
                    <StockBadge status={item.insight.status} className="print:hidden" />
                    <div className="relative w-32">
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        value={qty[item.id] ?? ""}
                        onChange={(e) => setQty((q) => ({ ...q, [item.id]: e.target.value }))}
                        className="input pr-12 text-right font-semibold"
                        aria-label={`Order quantity for ${item.name}`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400">{item.unit}</span>
                    </div>
                    <p className="w-20 text-right text-sm text-zinc-600">
                      {item.costPerUnit && Number(qty[item.id]) > 0 ? rupees(Math.round(Number(qty[item.id]) * item.costPerUnit)) : "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="sticky bottom-4 mt-6 flex flex-col gap-3 rounded-2xl bg-white/95 p-3 shadow-xl ring-1 ring-black/5 backdrop-blur sm:flex-row sm:items-center sm:justify-between print:static print:shadow-none">
        <div className="px-2 text-sm">
          <p className="font-semibold text-zinc-900">Estimated cost of this list: {rupees(Math.round(estimate))}</p>
          {message ? (
            <p className={clsx("mt-0.5 flex items-center gap-1.5", message.ok ? "text-emerald-700" : "text-red-700")}>
              {message.ok && <CircleCheck className="h-4 w-4" />} {message.text}
            </p>
          ) : (
            <p className="mt-0.5 text-zinc-500 print:hidden">Tick the items that arrived, then record the delivery.</p>
          )}
        </div>
        <button onClick={receive} disabled={saving || toReceive.length === 0} className="btn-primary print:hidden">
          {saving ? "Saving…" : `Record delivery${toReceive.length ? ` (${toReceive.length})` : ""}`}
        </button>
      </div>
    </div>
  );
}
