"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronRight, Clock, Leaf, Minus, Plus, Search, Star, Store, Timer, Wallet, X } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { VegMark } from "@/components/VegMark";
import { DishImage } from "./DishImage";

export interface MenuDish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isVeg: boolean;
  emoji: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isBestseller: boolean;
}

export interface MenuSection {
  id: string;
  name: string;
  items: MenuDish[];
}

export function MenuBrowser({
  sections,
  settings,
  firstName,
}: {
  sections: MenuSection[];
  settings: { open: boolean; hours: string };
  firstName: string | null;
}) {
  const cart = useCart();
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [bestOnly, setBestOnly] = useState(false);
  const [active, setActive] = useState(sections[0]?.id);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (i) =>
            (!vegOnly || i.isVeg) &&
            (!bestOnly || i.isBestseller) &&
            (!q || i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [sections, query, vegOnly, bestOnly]);

  const bestsellers = useMemo(
    () => sections.flatMap((s) => s.items).filter((i) => i.isBestseller && i.isAvailable && (!vegOnly || i.isVeg)),
    [sections, vegOnly],
  );
  const showBestsellers = !query && !bestOnly && bestsellers.length > 0;

  // Highlight the category chip for the section currently on screen.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-140px 0px -60% 0px" },
    );
    filtered.forEach((s) => {
      const el = document.getElementById(`cat-${s.id}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [filtered]);

  const dishCount = sections.reduce((n, s) => n + s.items.length, 0);

  const toggles = (
    <>
      <button
        onClick={() => setVegOnly((v) => !v)}
        className={clsx("chip", vegOnly && "border-veg bg-emerald-50 text-emerald-700")}
        aria-pressed={vegOnly}
      >
        <Leaf className="h-4 w-4" /> Veg only
      </button>
      <button onClick={() => setBestOnly((v) => !v)} className={clsx("chip", bestOnly && "chip-active")} aria-pressed={bestOnly}>
        <Star className="h-4 w-4" /> Bestsellers
      </button>
    </>
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-36 pt-5 sm:px-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-orange-500 p-6 text-white shadow-card sm:p-9">
        <div className="relative z-10 max-w-xl">
          <p className="text-sm font-semibold text-white/80">Hi {firstName ?? "there"} 👋</p>
          <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            Hungry? The mess canteen is a tap away.
          </h1>
          <p className="mt-2 text-sm text-white/85 sm:text-base">
            Order snacks, Maggi, shakes and more, then pick it up hot from the counter. No standing in line.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                settings.open ? "bg-white text-emerald-700" : "bg-zinc-900/40 text-white",
              )}
            >
              <span className={clsx("h-2 w-2 rounded-full", settings.open ? "bg-emerald-500" : "bg-zinc-300")} />
              {settings.open ? "Open now" : "Closed"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" /> {settings.hours}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <Timer className="h-3.5 w-3.5" /> Ready in ~10–15 min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5">
              <Wallet className="h-3.5 w-3.5" /> Pay at counter · Cash / UPI
            </span>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-72 select-none sm:block">
          <span className="absolute right-10 top-6 rotate-12 text-7xl drop-shadow-lg">🍜</span>
          <span className="absolute right-44 top-16 -rotate-12 text-5xl drop-shadow-lg">☕</span>
          <span className="absolute bottom-6 right-28 rotate-6 text-6xl drop-shadow-lg">🥪</span>
          <span className="absolute bottom-16 right-4 -rotate-6 text-5xl drop-shadow-lg">🧋</span>
        </div>
      </section>

      {!settings.open && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Store className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <b>The canteen isn&apos;t taking orders right now.</b> You can still browse the menu. Timings: {settings.hours}.
          </p>
        </div>
      )}

      {/* Search + filters (sticky) */}
      <div className="sticky top-16 z-30 -mx-4 mt-5 bg-stone-50/95 px-4 pb-3 pt-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${dishCount} dishes…`}
              className="input rounded-2xl py-3 pl-10 pr-10 shadow-sm"
              aria-label="Search the menu"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div className="hidden gap-2 sm:flex">{toggles}</div>
        </div>
        <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 lg:hidden">
          <span className="flex shrink-0 gap-2 sm:hidden">
            {toggles}
            <span className="my-1 w-px bg-zinc-200" aria-hidden />
          </span>
          {filtered.map((s) => (
            <a key={s.id} href={`#cat-${s.id}`} className={clsx("chip", active === s.id && "chip-active")}>
              {s.name}
            </a>
          ))}
        </div>
      </div>

      <div className="mt-2 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Desktop category rail */}
        <aside className="hidden lg:block">
          <nav className="sticky top-40 space-y-1">
            <p className="label px-3">Menu</p>
            {filtered.map((s) => (
              <a
                key={s.id}
                href={`#cat-${s.id}`}
                className={clsx(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition",
                  active === s.id ? "bg-brand-50 text-brand-700" : "text-zinc-600 hover:bg-zinc-100",
                )}
              >
                {s.name}
                <span className="text-xs text-zinc-400">{s.items.length}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {showBestsellers && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-zinc-900">Bestsellers on campus</h2>
              <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {bestsellers.map((dish) => (
                  <div key={dish.id} className="card w-40 shrink-0 overflow-hidden">
                    <DishImage name={dish.name} emoji={dish.emoji} imageUrl={dish.imageUrl} className="h-28 w-full" />
                    <div className="p-3">
                      <div className="flex items-center gap-1.5">
                        <VegMark isVeg={dish.isVeg} className="scale-90" />
                        <p className="truncate text-sm font-semibold text-zinc-900">{dish.name}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-semibold">₹{dish.price}</span>
                        <AddControl dish={dish} disabled={!settings.open} compact />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="card mt-4 p-10 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-2 font-semibold text-zinc-900">No dishes match your search</p>
              <p className="text-sm text-zinc-500">Try another name or clear the filters.</p>
            </div>
          )}

          {filtered.map((section) => (
            <section key={section.id} id={`cat-${section.id}`} className="mb-4">
              <h2 className="flex items-baseline gap-2 border-b border-zinc-200 pb-2 pt-4 text-lg font-bold text-zinc-900">
                {section.name}
                <span className="text-sm font-medium text-zinc-400">{section.items.length}</span>
              </h2>
              <div>
                {section.items.map((dish) => (
                  <article
                    key={dish.id}
                    className="flex gap-4 border-b border-dashed border-zinc-200 py-5 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <VegMark isVeg={dish.isVeg} />
                        {dish.isBestseller && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Bestseller
                          </span>
                        )}
                      </div>
                      <h3 className={clsx("mt-1.5 text-base font-semibold", dish.isAvailable ? "text-zinc-900" : "text-zinc-400")}>
                        {dish.name}
                      </h3>
                      <p className="mt-0.5 text-[15px] font-semibold text-zinc-800">₹{dish.price}</p>
                      {dish.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{dish.description}</p>}
                    </div>
                    <div className="relative shrink-0 pb-4">
                      <DishImage
                        name={dish.name}
                        emoji={dish.emoji}
                        imageUrl={dish.imageUrl}
                        className={clsx("h-28 w-28 rounded-2xl sm:h-32 sm:w-32", !dish.isAvailable && "opacity-50 grayscale")}
                      />
                      <div className="absolute inset-x-0 bottom-0 flex justify-center">
                        {dish.isAvailable ? (
                          <AddControl dish={dish} disabled={!settings.open} />
                        ) : (
                          <span className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-500 shadow ring-1 ring-zinc-200">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {cart.ready && cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
          <Link
            href="/checkout"
            className="flex w-full max-w-xl items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-white shadow-2xl shadow-brand-600/30 transition hover:bg-brand-700"
          >
            <span>
              <span className="block text-xs font-medium text-white/80">
                {cart.count} item{cart.count === 1 ? "" : "s"} added
              </span>
              <span className="block text-lg font-bold">₹{cart.total}</span>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              View cart <ChevronRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}

function AddControl({ dish, disabled, compact }: { dish: MenuDish; disabled?: boolean; compact?: boolean }) {
  const cart = useCart();
  const qty = cart.quantityOf(dish.id);
  const size = compact ? "h-8 w-[72px] text-xs" : "h-9 w-24 text-sm";

  if (qty === 0) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          cart.add({ menuItemId: dish.id, name: dish.name, price: dish.price, isVeg: dish.isVeg, emoji: dish.emoji })
        }
        className={clsx(
          "relative rounded-lg border border-brand-200 bg-white font-extrabold text-brand-600 shadow-md transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60",
          size,
        )}
        aria-label={`Add ${dish.name}`}
      >
        ADD
        <Plus className="absolute right-1 top-1 h-3 w-3" />
      </button>
    );
  }
  return (
    <div className={clsx("flex items-center justify-between rounded-lg bg-brand-600 font-bold text-white shadow-md", size)}>
      <button
        type="button"
        onClick={() => cart.decrement(dish.id)}
        className="flex h-full flex-1 items-center justify-center rounded-l-lg hover:bg-brand-700"
        aria-label={`Remove one ${dish.name}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span aria-live="polite">{qty}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          cart.add({ menuItemId: dish.id, name: dish.name, price: dish.price, isVeg: dish.isVeg, emoji: dish.emoji })
        }
        className="flex h-full flex-1 items-center justify-center rounded-r-lg hover:bg-brand-700 disabled:opacity-60"
        aria-label={`Add one more ${dish.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
