"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowDown,
  Bike,
  ChevronRight,
  Clock,
  Leaf,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Store,
  Ticket,
  Timer,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { VegMark } from "@/components/VegMark";
import { Marquee } from "@/components/motion/Marquee";
import { Parallax } from "@/components/motion/Parallax";
import { reveal } from "@/components/motion/revealProps";
import { SplitWords } from "@/components/motion/SplitWords";
import { Sticker } from "@/components/motion/Sticker";
import { PHOTOS, photoUrl } from "@/lib/photos";
import { DishImage } from "./DishImage";

const STEPS = [
  { title: "Pick your food", text: "Browse the canteen menu, filter veg-only or bestsellers, and add to your cart.", Icon: UtensilsCrossed },
  { title: "Place the order", text: "Choose counter pickup or delivery to your hostel room. Pay by cash or UPI.", Icon: ShoppingBag },
  { title: "Get a token", text: "You get a token number and a live tracker as the kitchen prepares it.", Icon: Ticket },
  { title: "Collect & enjoy", text: "Pick it up hot when it's ready, or we bring it to your room.", Icon: Bike },
];

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
    <main className="mx-auto w-full max-w-6xl overflow-x-clip px-4 pb-36 pt-2 sm:px-6">
      {/* Hero: split headline and photo collage */}
      <section className="relative grid items-center gap-10 pb-6 pt-4 lg:grid-cols-[1.05fr_1fr] lg:pt-10">
        <div className="relative z-10">
          <p className="eyebrow animate-page-in">
            <span className="h-px w-8 bg-brand-600" aria-hidden /> Hi {firstName ?? "there"}, welcome to the mess canteen
          </p>
          <h1 className="display mt-4 text-[2.9rem] text-ink sm:text-6xl lg:text-7xl">
            <SplitWords text="Hungry? Your canteen is" />{" "}
            <span className="relative inline-block text-brand-600">
              <SplitWords text="a tap away." />
              <svg viewBox="0 0 300 20" className="absolute -bottom-2 left-0 h-3 w-full text-gold-400" aria-hidden preserveAspectRatio="none">
                <path d="M2 14 C 80 2, 200 2, 298 12" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p {...reveal("up", 300)} className="mt-6 max-w-lg text-base leading-relaxed text-zinc-600 sm:text-lg">
            Order snacks, Maggi, shakes and more, then pick it up hot from the counter or get it sent to your hostel room. No
            standing in line.
          </p>
          <div {...reveal("up", 400)} className="mt-7 flex flex-wrap gap-3">
            <a href="#menu" className="btn-primary px-7 py-3.5 text-base">
              Browse the menu <ArrowDown className="h-4 w-4" />
            </a>
            {firstName && (
              <Link href="/orders" className="btn-secondary px-6 py-3.5 text-base">
                My orders
              </Link>
            )}
          </div>
          <div {...reveal("up", 500)} className="mt-8 flex flex-wrap gap-2 text-xs font-semibold">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ring-1",
                settings.open ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-zinc-100 text-zinc-600 ring-zinc-200",
              )}
            >
              <span className={clsx("relative flex h-2 w-2")}>
                {settings.open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                <span className={clsx("relative h-2 w-2 rounded-full", settings.open ? "bg-emerald-500" : "bg-zinc-400")} />
              </span>
              {settings.open ? "Open now" : "Closed"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink/80 ring-1 ring-brand-950/10">
              <Clock className="h-3.5 w-3.5 text-brand-600" /> {settings.hours}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink/80 ring-1 ring-brand-950/10">
              <Timer className="h-3.5 w-3.5 text-brand-600" /> Ready in ~10–15 min
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink/80 ring-1 ring-brand-950/10">
              <Wallet className="h-3.5 w-3.5 text-brand-600" /> Cash / UPI
            </span>
          </div>
        </div>

        <div className="relative mx-auto aspect-[5/5] w-full max-w-[520px] lg:aspect-[5/5.4]">
          <div {...reveal("zoom", 100)} className="absolute inset-x-6 inset-y-0 overflow-hidden rounded-[2.5rem] bg-brand-100 shadow-lift sm:inset-x-10">
            <Parallax speed={-0.06} className="absolute inset-x-0 -top-[10%] h-[120%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(PHOTOS.thali, 900, 1100)} alt={PHOTOS.thali.alt} className="h-full w-full object-cover" />
            </Parallax>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/40 via-transparent to-transparent" />
          </div>
          <div
            {...reveal("left", 350)}
            className="absolute -left-1 top-[12%] w-28 rotate-[-8deg] overflow-hidden rounded-3xl border-4 border-cream-50 shadow-lift sm:w-36"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(PHOTOS.chai, 300, 360)} alt={PHOTOS.chai.alt} className="aspect-[5/6] w-full animate-float object-cover" />
          </div>
          <div
            {...reveal("right", 500)}
            className="absolute -right-1 bottom-[10%] w-32 rotate-[7deg] overflow-hidden rounded-3xl border-4 border-cream-50 shadow-lift sm:w-40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(PHOTOS.samosa, 340, 340)} alt={PHOTOS.samosa.alt} className="aspect-square w-full object-cover" />
          </div>
          <Sticker
            className="absolute -bottom-4 left-2 h-28 w-28 sm:left-6 sm:h-32 sm:w-32"
            center={
              <span className="block text-center font-display leading-none">
                <span className="block text-[10px] font-bold uppercase tracking-wider">Chai</span>
                <span className="block text-2xl font-extrabold">₹15</span>
              </span>
            }
          />
        </div>
      </section>

      {/* Category band */}
      <Marquee
        className="mx-[calc(50%-50vw)] mt-14 -rotate-1 bg-brand-600 py-4 font-display text-2xl font-extrabold uppercase tracking-tight text-white shadow-lift sm:-mx-6 sm:text-3xl"
        items={sections.map((s) => s.name)}
      />

      {/* How it works */}
      <section className="mt-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div {...reveal()}>
            <p className="eyebrow">How it works</p>
            <h2 className="display mt-3 text-4xl text-ink sm:text-5xl">From craving to counter in four steps</h2>
          </div>
          <p {...reveal("up", 120)} className="max-w-sm text-sm leading-relaxed text-zinc-600">
            Every order gets a token. Watch it move from the kitchen to the counter, or to your hostel room, live.
          </p>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              {...reveal("up", i * 110)}
              className={clsx(
                "card card-hover group relative overflow-hidden p-6",
                i === 1 && "bg-brand-600 text-white ring-0",
                i === 3 && "bg-brand-950 text-white ring-0",
              )}
            >
              <span
                className={clsx(
                  "font-display text-6xl font-extrabold leading-none tracking-tighter",
                  i === 1 || i === 3 ? "text-white/25" : "text-brand-100",
                )}
              >
                0{i + 1}
              </span>
              <step.Icon className={clsx("absolute right-6 top-6 h-7 w-7 transition duration-500 group-hover:rotate-12 group-hover:scale-110", i === 1 || i === 3 ? "text-gold-300" : "text-brand-600")} />
              <h3 className="mt-6 text-xl font-bold">{step.title}</h3>
              <p className={clsx("mt-2 text-sm leading-relaxed", i === 1 || i === 3 ? "text-white/75" : "text-zinc-600")}>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Photo band */}
      <section className="relative mt-20 overflow-hidden rounded-[2.5rem] bg-brand-950 text-white">
        <Parallax speed={0.1} className="absolute inset-0 -top-[15%] h-[130%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(PHOTOS.diners, 1600, 900)} alt="" className="h-full w-full object-cover opacity-45" loading="lazy" />
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/80 to-brand-900/20" />
        <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:p-16">
          <div {...reveal("left")}>
            <p className="eyebrow !text-gold-300">Made in our own mess kitchen</p>
            <h2 className="display mt-3 text-4xl sm:text-5xl">Campus favourites, cooked fresh every day.</h2>
            <p className="mt-4 max-w-md text-white/75">
              The same team that runs the mess runs the canteen. Stock is tracked daily, so what you see on the menu is what the
              kitchen has.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 self-end">
            {[
              [String(dishCount), "dishes on the menu"],
              [String(sections.length), "categories"],
              ["10–15", "minutes to ready"],
              ["₹15", "for a kadak chai"],
            ].map(([n, label], i) => (
              <div key={label} {...reveal("up", i * 90)} className="rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                <p className="font-display text-3xl font-extrabold text-gold-300">{n}</p>
                <p className="text-xs font-medium text-white/75">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div id="menu" className="scroll-mt-16 pt-16" />
      <div {...reveal()} className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The menu</p>
          <h2 className="display mt-3 text-4xl text-ink sm:text-5xl">What are you having?</h2>
        </div>
      </div>

      {!settings.open && (
        <div className="mt-8 flex items-start gap-3 rounded-3xl border border-gold-300 bg-gold-100 p-4 text-sm text-amber-950">
          <Store className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            <b>The canteen isn&apos;t taking orders right now.</b> You can still browse the menu. Timings: {settings.hours}.
          </p>
        </div>
      )}

      {/* Search + filters (sticky) */}
      <div className="sticky top-16 z-30 -mx-4 mt-6 bg-cream-100/90 px-4 pb-3 pt-3 backdrop-blur-lg sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${dishCount} dishes…`}
              className="input rounded-full py-3.5 pl-11 pr-10 shadow-sm"
              aria-label="Search the menu"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-brand-50"
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
            <span className="my-1 w-px bg-brand-950/10" aria-hidden />
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
                  "flex items-center justify-between rounded-full px-4 py-2 text-sm font-semibold transition duration-300",
                  active === s.id ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20" : "text-ink/70 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {s.name}
                <span className={clsx("text-xs", active === s.id ? "text-white/70" : "text-zinc-400")}>{s.items.length}</span>
              </a>
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          {showBestsellers && (
            <section className="mb-6">
              <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-ink"><Star className="h-5 w-5 fill-gold-400 text-gold-400" /> Bestsellers on campus</h2>
              <div className="no-scrollbar -mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-4 pt-1 sm:mx-0 sm:px-0">
                {bestsellers.map((dish, i) => (
                  <div key={dish.id} {...reveal("up", Math.min(i, 6) * 70)} className="card card-hover group w-44 shrink-0 overflow-hidden">
                    <div className="overflow-hidden">
                      <DishImage name={dish.name} emoji={dish.emoji} imageUrl={dish.imageUrl} className="h-32 w-full transition duration-700 ease-out group-hover:scale-110" />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-1.5">
                        <VegMark isVeg={dish.isVeg} className="scale-90" />
                        <p className="truncate text-sm font-semibold text-ink">{dish.name}</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-display text-base font-bold text-brand-700">₹{dish.price}</span>
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
              <Search className="mx-auto h-9 w-9 text-brand-300" />
              <p className="mt-2 font-semibold text-ink">No dishes match your search</p>
              <p className="text-sm text-zinc-500">Try another name or clear the filters.</p>
            </div>
          )}

          {filtered.map((section) => (
            <section key={section.id} id={`cat-${section.id}`} className="mb-8">
              <h2 className="flex items-baseline gap-3 pb-3 pt-6 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {section.name}
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-sans text-xs font-bold text-brand-700">{section.items.length}</span>
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {section.items.map((dish, i) => (
                  <article
                    key={dish.id}
                    {...reveal("up", (i % 2) * 80)}
                    className="card card-hover group flex gap-4 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <VegMark isVeg={dish.isVeg} />
                        {dish.isBestseller && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                            <Star className="h-3 w-3 fill-gold-500 text-gold-500" /> Bestseller
                          </span>
                        )}
                      </div>
                      <h3 className={clsx("mt-2 text-lg font-bold leading-snug", dish.isAvailable ? "text-ink" : "text-zinc-400")}>
                        {dish.name}
                      </h3>
                      <p className="mt-0.5 font-display text-lg font-bold text-brand-700">₹{dish.price}</p>
                      {dish.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{dish.description}</p>}
                    </div>
                    <div className="relative shrink-0 pb-4">
                      <div className="overflow-hidden rounded-[1.25rem]">
                        <DishImage
                          name={dish.name}
                          emoji={dish.emoji}
                          imageUrl={dish.imageUrl}
                          className={clsx(
                            "h-28 w-28 transition duration-700 ease-out group-hover:scale-110 sm:h-32 sm:w-32",
                            !dish.isAvailable && "opacity-50 grayscale",
                          )}
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex justify-center">
                        {dish.isAvailable ? (
                          <AddControl dish={dish} disabled={!settings.open} />
                        ) : (
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-500 shadow ring-1 ring-zinc-200">
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
            className="group flex w-full max-w-xl animate-page-in items-center justify-between rounded-full bg-brand-600 py-3 pl-7 pr-5 text-white shadow-2xl shadow-brand-900/40 ring-4 ring-cream-50/60 transition duration-300 hover:-translate-y-0.5 hover:bg-brand-700"
          >
            <span>
              <span className="block text-xs font-medium text-white/80">
                {cart.count} item{cart.count === 1 ? "" : "s"} added
              </span>
              <span className="block font-display text-xl font-extrabold">₹{cart.total}</span>
            </span>
            <span className="flex items-center gap-1 font-semibold">
              View cart <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
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
          "relative rounded-full border border-brand-200 bg-white font-extrabold tracking-wide text-brand-600 shadow-md transition duration-300 hover:-translate-y-0.5 hover:border-brand-600 hover:bg-brand-600 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:text-brand-600",
          size,
        )}
        aria-label={`Add ${dish.name}`}
      >
        ADD
        <Plus className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2" />
      </button>
    );
  }
  return (
    <div className={clsx("flex items-center justify-between rounded-full bg-brand-600 font-bold text-white shadow-md shadow-brand-900/25", size)}>
      <button
        type="button"
        onClick={() => cart.decrement(dish.id)}
        className="flex h-full flex-1 items-center justify-center rounded-l-full hover:bg-brand-700"
        aria-label={`Remove one ${dish.name}`}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span key={qty} className="animate-pop" aria-live="polite">{qty}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          cart.add({ menuItemId: dish.id, name: dish.name, price: dish.price, isVeg: dish.isVeg, emoji: dish.emoji })
        }
        className="flex h-full flex-1 items-center justify-center rounded-r-full hover:bg-brand-700 disabled:opacity-60"
        aria-label={`Add one more ${dish.name}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
