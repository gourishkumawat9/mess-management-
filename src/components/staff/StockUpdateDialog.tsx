"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/client";
import type { MovementType } from "@/lib/constants";
import { formatQty } from "@/lib/format";

export interface StockTarget {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPerUnit: number | null;
}

const MODES: { type: MovementType; label: string; help: string }[] = [
  { type: "USAGE", label: "Used", help: "Taken out for cooking or serving" },
  { type: "RESTOCK", label: "Restocked", help: "New stock delivered" },
  { type: "WASTAGE", label: "Wasted", help: "Spoiled, expired or thrown away" },
  { type: "ADJUSTMENT", label: "Set count", help: "Correct the stock to an exact counted amount" },
];

export function StockUpdateDialog({
  item,
  onClose,
  initialType = "USAGE",
}: {
  item: StockTarget | null;
  onClose: () => void;
  initialType?: MovementType;
}) {
  const router = useRouter();
  const [type, setType] = useState<MovementType>(initialType);
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setType(initialType);
    setQuantity("");
    setUnitCost(item?.costPerUnit != null ? String(item.costPerUnit) : "");
    setNote("");
    setError(null);
  }, [item, initialType]);

  if (!item) return null;

  const q = Number(quantity);
  const valid = quantity !== "" && Number.isFinite(q) && q >= 0 && (type === "ADJUSTMENT" || q > 0);
  const after = !valid ? null : type === "RESTOCK" ? item.quantity + q : type === "ADJUSTMENT" ? q : item.quantity - q;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !valid) return;
    setSaving(true);
    setError(null);
    try {
      await api(`/api/inventory/${item.id}/movements`, {
        body: {
          type,
          quantity: q,
          unitCost: type === "RESTOCK" && unitCost !== "" ? Number(unitCost) : null,
          note,
        },
      });
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title={`Update ${item.name}`} onClose={onClose}>
      <p className="-mt-2 mb-4 text-sm text-zinc-500">
        In stock now: <b className="text-zinc-900">{formatQty(item.quantity, item.unit)}</b>
      </p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-zinc-100 p-1">
          {MODES.map((m) => (
            <button
              key={m.type}
              type="button"
              onClick={() => setType(m.type)}
              className={clsx(
                "rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm",
                type === m.type ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">{MODES.find((m) => m.type === type)?.help}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className={type === "RESTOCK" ? "" : "col-span-2"}>
            <label htmlFor="qty" className="label">
              {type === "ADJUSTMENT" ? "Counted quantity" : "Quantity"} ({item.unit})
            </label>
            <input
              id="qty"
              autoFocus
              required
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input text-lg font-semibold"
            />
          </div>
          {type === "RESTOCK" && (
            <div>
              <label htmlFor="cost" className="label">₹ per {item.unit}</label>
              <input id="cost" type="number" inputMode="decimal" min={0} step="any" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="input" placeholder="optional" />
            </div>
          )}
        </div>
        <div>
          <label htmlFor="note" className="label">Note (optional)</label>
          <input id="note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} className="input" placeholder={type === "RESTOCK" ? "Supplier, bill no." : "e.g. lunch, dinner"} />
        </div>

        {after !== null && (
          <p className={clsx("rounded-xl p-3 text-sm", after < 0 ? "bg-red-50 text-red-700" : "bg-zinc-50 text-zinc-700")}>
            {after < 0 ? "That's more than what's in stock." : <>Stock after this update: <b>{formatQty(after, item.unit)}</b></>}
          </p>
        )}
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!valid || saving || (after !== null && after < 0)} className="btn-primary w-full py-3">
          {saving ? "Saving…" : "Save update"}
        </button>
      </form>
    </Modal>
  );
}
