"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Pencil, Plus, Star } from "lucide-react";
import { DishImage } from "@/components/canteen/DishImage";
import { Modal } from "@/components/Modal";
import { VegMark } from "@/components/VegMark";
import { api } from "@/lib/client";

interface Dish {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  emoji: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isBestseller: boolean;
}

interface Category {
  id: string;
  name: string;
  items: Dish[];
}

type Draft = Omit<Dish, "id" | "price"> & { id?: string; price: string };

const blankDraft = (categoryId: string): Draft => ({
  categoryId,
  name: "",
  description: "",
  price: "",
  isVeg: true,
  emoji: "",
  imageUrl: "",
  isAvailable: true,
  isBestseller: false,
});

export function MenuManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");

  const available = categories.reduce((n, c) => n + c.items.filter((i) => i.isAvailable).length, 0);
  const total = categories.reduce((n, c) => n + c.items.length, 0);

  async function patch(dish: Dish, body: Partial<Dish> & { archived?: boolean }) {
    setBusyId(dish.id);
    try {
      await api(`/api/menu/items/${dish.id}`, { method: "PATCH", body });
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusyId(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    const { id, ...rest } = draft;
    const body = { ...rest, price: Number(draft.price) };
    try {
      if (id) await api(`/api/menu/items/${id}`, { method: "PATCH", body });
      else await api("/api/menu/items", { body });
      setDraft(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function removeDish() {
    if (!draft?.id || !window.confirm(`Remove "${draft.name}" from the menu? Past orders keep their history.`)) return;
    setSaving(true);
    try {
      await api(`/api/menu/items/${draft.id}`, { method: "PATCH", body: { archived: true } });
      setDraft(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setSaving(false);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/menu/categories", { body: { name: newCategory } });
      setNewCategory("");
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not add the category");
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Canteen menu</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {available} of {total} dishes available right now. Switch a dish off when it runs out.
          </p>
        </div>
        <button onClick={() => setDraft(blankDraft(categories[0]?.id ?? ""))} className="btn-primary" disabled={!categories.length}>
          <Plus className="h-4 w-4" /> Add dish
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {categories.map((cat) => (
          <section key={cat.id} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <h2 className="font-bold text-zinc-900">
                {cat.name} <span className="font-medium text-zinc-400">· {cat.items.length}</span>
              </h2>
              <button onClick={() => setDraft(blankDraft(cat.id))} className="btn-ghost btn-sm">
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
            {cat.items.length === 0 && <p className="p-4 text-sm text-zinc-500">No dishes yet.</p>}
            <ul className="divide-y divide-zinc-100">
              {cat.items.map((dish) => (
                <li key={dish.id} className={clsx("flex items-center gap-3 px-4 py-3", !dish.isAvailable && "bg-zinc-50")}>
                  <DishImage name={dish.name} emoji={dish.emoji} imageUrl={dish.imageUrl} size="sm" className={clsx("h-11 w-11 shrink-0 rounded-xl", !dish.isAvailable && "grayscale")} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <VegMark isVeg={dish.isVeg} className="scale-90" />
                      <p className="truncate font-semibold text-zinc-900">{dish.name}</p>
                    </div>
                    <p className="text-sm text-zinc-500">₹{dish.price}</p>
                  </div>
                  <button
                    onClick={() => patch(dish, { isBestseller: !dish.isBestseller })}
                    disabled={busyId === dish.id}
                    className={clsx("rounded-lg p-2", dish.isBestseller ? "text-amber-500" : "text-zinc-300 hover:text-zinc-400")}
                    title={dish.isBestseller ? "Bestseller (tap to remove)" : "Mark as bestseller"}
                    aria-pressed={dish.isBestseller}
                  >
                    <Star className={clsx("h-5 w-5", dish.isBestseller && "fill-amber-400")} />
                  </button>
                  <button
                    onClick={() => patch(dish, { isAvailable: !dish.isAvailable })}
                    disabled={busyId === dish.id}
                    className="flex items-center gap-2 text-xs font-semibold"
                    aria-pressed={dish.isAvailable}
                    title={dish.isAvailable ? "Available: tap to mark sold out" : "Sold out: tap to make available"}
                  >
                    <span className={clsx("relative h-6 w-11 rounded-full transition", dish.isAvailable ? "bg-emerald-500" : "bg-zinc-300")}>
                      <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", dish.isAvailable ? "left-[22px]" : "left-0.5")} />
                    </span>
                    <span className={clsx("hidden w-16 text-left sm:inline", dish.isAvailable ? "text-emerald-700" : "text-zinc-500")}>
                      {dish.isAvailable ? "In stock" : "Sold out"}
                    </span>
                  </button>
                  <button onClick={() => setDraft({ ...dish, price: String(dish.price) })} className="btn-ghost btn-sm" aria-label={`Edit ${dish.name}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <form onSubmit={addCategory} className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="newCategory" className="label">New menu section</label>
          <input id="newCategory" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="input" placeholder="e.g. Breakfast" />
        </div>
        <button type="submit" className="btn-secondary" disabled={newCategory.trim().length < 2}>
          Add section
        </button>
      </form>

      <Modal open={!!draft} title={draft?.id ? "Edit dish" : "Add a dish"} onClose={() => setDraft(null)}>
        {draft && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label" htmlFor="dish-name">Name</label>
              <input id="dish-name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="dish-price">Price (₹)</label>
                <input id="dish-price" required type="number" min={0} step={1} inputMode="numeric" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="dish-cat">Section</label>
                <select id="dish-cat" value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} className="input">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="dish-desc">Description</label>
              <textarea id="dish-desc" rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="input resize-none" />
            </div>
            <div className="grid grid-cols-[96px_1fr] gap-3">
              <div>
                <label className="label" htmlFor="dish-emoji">Emoji</label>
                <input id="dish-emoji" value={draft.emoji ?? ""} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} className="input text-center text-xl" placeholder="🍜" />
              </div>
              <div>
                <label className="label" htmlFor="dish-img">Photo URL (optional)</label>
                <input id="dish-img" value={draft.imageUrl ?? ""} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} className="input" placeholder="https://…" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["isVeg", "Vegetarian"],
                  ["isAvailable", "Available"],
                  ["isBestseller", "Bestseller"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className={clsx("chip cursor-pointer", draft[key] && "chip-active")}>
                  <input type="checkbox" className="sr-only" checked={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} />
                  {draft[key] ? "✓ " : ""}
                  {label}
                </label>
              ))}
            </div>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex gap-2 pt-2">
              {draft.id && (
                <button type="button" onClick={removeDish} disabled={saving} className="btn-danger">
                  Remove
                </button>
              )}
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving…" : "Save dish"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
