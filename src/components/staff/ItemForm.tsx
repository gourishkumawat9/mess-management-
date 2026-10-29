"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { api } from "@/lib/client";
import { INVENTORY_CATEGORIES, INVENTORY_UNITS } from "@/lib/constants";

export interface ItemDetails {
  id: string;
  name: string;
  category: string;
  unit: string;
  reorderLevel: number;
  parLevel: number;
  costPerUnit: number | null;
  supplier: string | null;
  shelfLifeDays: number | null;
  notes: string | null;
}

type Fields = Record<
  "name" | "category" | "unit" | "quantity" | "reorderLevel" | "parLevel" | "costPerUnit" | "supplier" | "shelfLifeDays" | "notes",
  string
>;

const toFields = (item?: ItemDetails): Fields => ({
  name: item?.name ?? "",
  category: item?.category ?? "VEGETABLES",
  unit: item?.unit ?? "kg",
  quantity: "",
  reorderLevel: item ? String(item.reorderLevel) : "",
  parLevel: item ? String(item.parLevel) : "",
  costPerUnit: item?.costPerUnit != null ? String(item.costPerUnit) : "",
  supplier: item?.supplier ?? "",
  shelfLifeDays: item?.shelfLifeDays != null ? String(item.shelfLifeDays) : "",
  notes: item?.notes ?? "",
});

const num = (v: string) => (v.trim() === "" ? null : Number(v));

/** Add a new inventory item, or edit an existing one's details. */
export function ItemForm({
  open,
  item,
  onClose,
  onCreated,
}: {
  open: boolean;
  item?: ItemDetails;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const router = useRouter();
  const [f, setF] = useState<Fields>(() => toFields(item));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      name: f.name,
      category: f.category,
      unit: f.unit,
      reorderLevel: num(f.reorderLevel) ?? 0,
      parLevel: num(f.parLevel) ?? 0,
      costPerUnit: num(f.costPerUnit),
      supplier: f.supplier,
      shelfLifeDays: num(f.shelfLifeDays),
      notes: f.notes,
      ...(item ? {} : { quantity: num(f.quantity) ?? 0 }),
    };
    try {
      if (item) {
        await api(`/api/inventory/${item.id}`, { method: "PATCH", body });
      } else {
        const res = await api<{ item: { id: string } }>("/api/inventory", { body });
        onCreated?.(res.item.id);
        setF(toFields());
      }
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!item || !window.confirm(`Stop tracking ${item.name}? Its history is kept.`)) return;
    setSaving(true);
    try {
      await api(`/api/inventory/${item.id}`, { method: "PATCH", body: { archived: true } });
      router.push("/staff/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive");
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title={item ? `Edit ${item.name}` : "Add inventory item"} onClose={onClose} wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="i-name">Item name</label>
          <input id="i-name" required value={f.name} onChange={set("name")} className="input" placeholder="e.g. Tomato" />
        </div>
        <div>
          <label className="label" htmlFor="i-cat">Category</label>
          <select id="i-cat" value={f.category} onChange={set("category")} className="input">
            {INVENTORY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="i-unit">Unit</label>
          <select id="i-unit" value={f.unit} onChange={set("unit")} className="input">
            {INVENTORY_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        {!item && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="i-qty">Current stock ({f.unit})</label>
            <input id="i-qty" type="number" min={0} step="any" inputMode="decimal" value={f.quantity} onChange={set("quantity")} className="input" placeholder="0" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="i-reorder">Alert when below ({f.unit})</label>
          <input id="i-reorder" required type="number" min={0} step="any" inputMode="decimal" value={f.reorderLevel} onChange={set("reorderLevel")} className="input" />
          <p className="mt-1 text-xs text-zinc-500">The reorder level: shows as low stock at or below this.</p>
        </div>
        <div>
          <label className="label" htmlFor="i-par">Full stock target ({f.unit})</label>
          <input id="i-par" required type="number" min={0} step="any" inputMode="decimal" value={f.parLevel} onChange={set("parLevel")} className="input" />
          <p className="mt-1 text-xs text-zinc-500">Restock suggestions top up to this amount.</p>
        </div>
        <div>
          <label className="label" htmlFor="i-cost">Cost (₹ per {f.unit})</label>
          <input id="i-cost" type="number" min={0} step="any" inputMode="decimal" value={f.costPerUnit} onChange={set("costPerUnit")} className="input" placeholder="optional" />
        </div>
        <div>
          <label className="label" htmlFor="i-shelf">Shelf life (days)</label>
          <input id="i-shelf" type="number" min={1} step={1} inputMode="numeric" value={f.shelfLifeDays} onChange={set("shelfLifeDays")} className="input" placeholder="for milk, curd, paneer…" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="i-supplier">Supplier</label>
          <input id="i-supplier" value={f.supplier} onChange={set("supplier")} className="input" placeholder="optional" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="i-notes">Notes</label>
          <textarea id="i-notes" rows={2} value={f.notes} onChange={set("notes")} className="input resize-none" />
        </div>
        {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}
        <div className="flex gap-2 sm:col-span-2">
          {item && (
            <button type="button" onClick={archive} disabled={saving} className="btn-danger">
              Stop tracking
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? "Saving…" : item ? "Save changes" : "Add item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
