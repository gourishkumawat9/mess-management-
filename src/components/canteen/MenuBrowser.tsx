"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bike,
  ChevronRight,
  Clock,
  Flame,
  Leaf,
  Minus,
  Plus,
  Search,
  Star,
  Store,
  Ticket,
  UtensilsCrossed,
  Wallet,
  X,
} from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { VegMark } from "@/components/VegMark";
import { Marquee } from "@/components/motion/Marquee";
import { Parallax } from "@/components/motion/Parallax";
import { reveal } from "@/components/motion/revealProps";
import { ScrollWords } from "@/components/motion/ScrollWords";
import { SplitWords } from "@/components/motion/SplitWords";
import { Sticker } from "@/components/motion/Sticker";
import { PHOTOS, photoUrl, type Photo } from "@/lib/photos";
import { DishImage } from "./DishImage";

// Photo "cut-outs" that float around the hero headline at different depths.
// If a photo can't load (e.g. a blocked CDN), the emoji underneath shows instead.
const FLOATERS: { photo: Photo; emoji: string; className: string; speed: number; rotate: number; size: number }[] = [
  { photo: PHOTOS.thali, emoji: "🍜", className: "left-[1%] top-[6%] hidden h-44 w-44 sm:block", speed: 0.18, rotate: -8, size: 360 },
  { photo: PHOTOS.samosa, emoji: "🌯", className: "right-[2%] -top-[1%] h-16 w-16 sm:top-[2%] sm:h-36 sm:w-36", speed: 0.3, rotate: 10, size: 300 },
  { photo: PHOTOS.chai, emoji: "🍳", className: "left-[6%] bottom-[2%] hidden h-32 w-32 sm:block", speed: 0.1, rotate: 6, size: 280 },
  { photo: PHOTOS.dosa, emoji: "🥢", className: "right-[5%] bottom-[6%] hidden h-40 w-40 sm:block", speed: 0.22, rotate: -6, size: 340 },
  { photo: PHOTOS.sandwich, emoji: "🧀", className: "right-[3%] top-[44%] hidden h-20 w-20 lg:block", speed: 0.4, rotate: 14, size: 200 },
  { photo: PHOTOS.vadaPav, emoji: "🍗", className: "left-[4%] top-[46%] hidden h-20 w-20 lg:block", speed: 0.15, rotate: -12, size: 220 },
];

const PERKS = [
  { label: "Made fresh at night", Icon: Flame },
  { label: "Veg & non-veg", Icon: Leaf },
  { label: "Hostel room delivery", Icon: Bike },
  { label: "Cash or UPI", Icon: Wallet },
];

const WHY = [
  { title: "Order ahead", text: "Pick from the menu, filter veg-only or bestsellers, and place your order in a few taps.", Icon: UtensilsCrossed, tone: "bg-white text-ink", rotate: "-rotate-1" },
  { title: "Track your token", text: "Every order gets a token and a live tracker, from the kitchen to ready.", Icon: Ticket, tone: "bg-brand-600 text-white", rotate: "rotate-1" },
  { title: "Pickup or room", text: "Collect it hot from the counter, or have it delivered to your hostel room.", Icon: Bike, tone: "bg-gold-400 text-ink", rotate: "-rotate-1" },
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
  const prices = sections.flatMap((s) => s.items.map((i) => i.price));
  const cheapest = prices.length ? Math.min(...prices) : 0;
  const [pick, setPick] = useState(0);
  const featured = bestsellers.length ? bestsellers : sections.flatMap((s) => s.items).filter((i) => i.isAvailable).slice(0, 5);
  const current = featured.length ? featured[pick % featured.length] : null;
  const step = (d: number) => setPick((p) => (p + d + featured.length) % featured.length);

  const toggles = (
    <>
      <button
        onClick={() => setVegOnly((v) => !v)}
        className={clsx("chip", vegOnly && "!bg-veg text-white")}
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
    <main className="w-full overflow-x-clip pb-36">
      {/* Hero: giant stacked headline with floating food cut-outs */}
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {FLOATERS.map((f, i) => (
            <div key={i} className={clsx("absolute", f.className)}>
              <Parallax speed={f.speed} className="h-full w-full">
                <div
                  {...reveal("drop", 200 + i * 120, { "--r": `${f.rotate}deg` })}
                  className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-gold-300 shadow-hard"
                >
                  <span className="text-[2.6em] sm:text-5xl">{f.emoji}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl(f.photo, f.size, f.size)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                </div>
              </Parallax>
            </div>
          ))}
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <p className="scribble animate-page-in text-2xl text-brand-600 sm:text-3xl">
            Hey {firstName ?? "there"}, late night cravings?
          </p>
          <h1 className="display mt-3 text-[22vw] text-ink sm:text-[9.5rem] lg:text-[11.5rem]">
            <SplitWords text="Good food." />
            <span className="block text-brand-600">
              <SplitWords text="Good mood." />
            </span>
          </h1>
          <p {...reveal("up", 350)} className="mx-auto mt-6 max-w-xl text-base font-medium leading-relaxed text-ink/75 sm:text-lg">
            Maggi, noodles, Manchurian and rolls, cooked fresh in the canteen. Pick it up hot from the counter or get it sent to your
            hostel room. No standing in line.
          </p>
          <div {...reveal("up", 450)} className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#menu" className="btn-primary btn-xl">
              See the menu <ArrowRight className="h-5 w-5" />
            </a>
            {firstName && (
              <Link href="/orders" className="btn-secondary btn-xl">
                My orders
              </Link>
            )}
          </div>
          <div {...reveal("up", 550)} className="mt-8 flex flex-wrap justify-center gap-2.5">
            <span className={clsx("tag", settings.open ? "!bg-veg text-white" : "!bg-zinc-300")}>
              <span className="relative flex h-2 w-2">
                {settings.open && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />}
                <span className="relative h-2 w-2 rounded-full bg-white" />
              </span>
              {settings.open ? "Open now" : "Closed"}
            </span>
            <span className="tag !bg-white">
              <Clock className="h-3.5 w-3.5" /> {settings.hours}
            </span>
            <span className="tag rotate-2">From ₹{cheapest}</span>
          </div>
        </div>
      </section>

      {/* Crossing ticker bands */}
      <div className="relative my-6 py-10">
        <Marquee
          className="absolute inset-x-[-10%] top-1/2 -translate-y-1/2 -rotate-3 border-y-2 border-ink bg-ink py-3 font-display text-2xl uppercase text-cream-50"
          reverse
          separatorClassName="text-gold-400"
          items={["Order ahead", "Skip the queue", "Token & live tracking", "Pickup or room delivery", "Cash or UPI"]}
        />
        <Marquee
          className="relative -mx-[5%] rotate-2 border-y-2 border-ink bg-brand-600 py-4 font-display text-3xl uppercase text-white shadow-hard sm:text-4xl"
          separatorClassName="text-gold-400"
          items={sections.flatMap((s) => s.items.slice(0, 3).map((i) => `${i.name} ₹${i.price}`))}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Perk badges */}
        <ul className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {PERKS.map(({ label, Icon }, i) => (
            <li key={label} {...reveal("drop", i * 110, { "--r": `${[-6, 4, -3, 6][i]}deg` })} className="flex flex-col items-center text-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-ink bg-white shadow-hard transition duration-300 hover:-rotate-12 hover:bg-gold-300">
                <Icon className="h-9 w-9 text-brand-600" strokeWidth={2.2} />
              </span>
              <span className="mt-4 font-display text-xl uppercase leading-none text-ink">{label}</span>
            </li>
          ))}
        </ul>

        {/* Statement that fills in on scroll */}
        <section className="relative mt-28">
          <Sticker
            className="absolute -top-14 right-0 hidden h-28 w-28 rotate-12 sm:flex"
            tone="red"
            center={<span className="font-display text-3xl uppercase">2 AM</span>}
          />
          <ScrollWords
            text="Exams, deadlines or just a 2 AM craving. Your canteen is cooking, and it comes to your room."
            accent={[5, 6, 11, 16, 17]}
            className="display max-w-5xl text-[13vw] sm:text-7xl lg:text-8xl"
          />
        </section>

        {/* Pick your craving: featured dish slider */}
        {current && (
          <section className="mt-28">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div {...reveal()}>
                <p className="scribble text-3xl text-brand-600">can&apos;t decide?</p>
                <h2 className="display text-6xl text-ink sm:text-7xl">Pick your craving</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl text-ink">
                  N°{String((pick % featured.length) + 1).padStart(2, "0")}
                  <span className="text-ink/30"> / {String(featured.length).padStart(2, "0")}</span>
                </span>
                <button onClick={() => step(-1)} className="btn-secondary h-12 w-12 !p-0" aria-label="Previous dish">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <button onClick={() => step(1)} className="btn-primary h-12 w-12 !p-0" aria-label="Next dish">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div {...reveal("zoom")} className="card relative mt-8 grid overflow-hidden !rounded-[2rem] !shadow-hard-xl md:grid-cols-[1.1fr_1fr]">
              <div key={current.id} className="animate-page-in p-8 sm:p-12">
                <div className="flex items-center gap-2">
                  <VegMark isVeg={current.isVeg} />
                  {current.isBestseller && (
                    <span className="tag !py-0.5 !text-[10px]">
                      <Star className="h-3 w-3 fill-ink" /> Bestseller
                    </span>
                  )}
                </div>
                <h3 className="display mt-5 text-6xl text-ink sm:text-7xl">{current.name}</h3>
                <p className="mt-4 font-display text-5xl text-brand-600">₹{current.price}</p>
                <div className="mt-8">
                  <AddControl dish={current} disabled={!settings.open || !current.isAvailable} big />
                </div>
              </div>
              <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden border-t-2 border-ink bg-brand-600 md:border-l-2 md:border-t-0">
                <div aria-hidden className="absolute inset-0 opacity-25 [background:repeating-linear-gradient(45deg,transparent_0_18px,#22090e_18px_20px)]" />
                <div key={current.id} className="relative animate-page-in">
                  <DishImage
                    name={current.name}
                    emoji={current.emoji}
                    imageUrl={current.imageUrl}
                    size="lg"
                    className="h-56 w-56 rotate-3 rounded-full border-2 border-ink shadow-hard-lg sm:h-64 sm:w-64"
                  />
                </div>
                <Sticker
                  className="absolute bottom-5 right-5 h-24 w-24"
                  text="FRESH • HOT • TASTY • "
                  center={<Flame className="h-7 w-7" />}
                />
              </div>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              {featured.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setPick(i)}
                  className={clsx(
                    "h-3 rounded-full border-2 border-ink transition-all duration-300",
                    i === pick % featured.length ? "w-10 bg-brand-600" : "w-3 bg-white hover:bg-gold-300",
                  )}
                  aria-label={`Show ${d.name}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Why the app */}
        <section className="mt-28">
          <h2 {...reveal()} className="text-center text-sm font-extrabold uppercase tracking-[0.6em] text-brand-600">
            Why order here
          </h2>
          <p {...reveal("up", 100)} className="display mx-auto mt-4 max-w-3xl text-center text-5xl text-ink sm:text-6xl">
            We&apos;re ending cold Maggi and long queues.
          </p>
          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            {WHY.map((w, i) => (
              <li
                key={w.title}
                {...reveal("up", i * 120)}
                className={clsx("card group relative p-7 transition duration-300 hover:rotate-0 hover:shadow-hard-lg", w.tone, w.rotate)}
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-7xl leading-none opacity-90">0{i + 1}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-cream-50 text-ink transition duration-300 group-hover:rotate-12">
                    <w.Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-8 font-display text-3xl uppercase leading-none">{w.title}</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed opacity-80">{w.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Photo band */}
        <section {...reveal("zoom")} className="relative mt-28 overflow-hidden rounded-[2rem] border-2 border-ink bg-ink text-white shadow-hard-lg">
          <Parallax speed={0.1} className="absolute inset-0 -top-[15%] h-[130%]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(PHOTOS.diners, 1600, 900)} alt="" className="h-full w-full object-cover opacity-50" loading="lazy" />
          </Parallax>
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent" />
          <div className="relative grid gap-8 p-8 sm:p-12 lg:grid-cols-[1.3fr_1fr] lg:p-16">
            <div>
              <p className="scribble text-3xl text-gold-300">our superpower</p>
              <h2 className="display mt-2 text-5xl sm:text-7xl">Cooked in our own mess kitchen.</h2>
              <p className="mt-5 max-w-md font-medium text-white/80">
                The team that runs the mess runs the canteen. Stock is tracked every day, so what you see on the menu is what the
                kitchen has.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 self-end">
              {[
                [String(dishCount), "dishes"],
                [String(sections.length), "categories"],
                [settings.hours.split("–")[0]?.trim() || "Late", "opens at"],
                [`₹${cheapest}`, "starts at"],
              ].map(([n, label], i) => (
                <div key={label} {...reveal("up", i * 90)} className="rounded-2xl border-2 border-cream-50/80 bg-white/5 p-4 backdrop-blur">
                  <p className="font-display text-4xl text-gold-300">{n}</p>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/75">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The menu */}
        <div id="menu" className="scroll-mt-16 pt-24" />
        <div {...reveal()} className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="scribble text-3xl text-brand-600">what are you having?</p>
            <h2 className="display text-7xl text-ink sm:text-8xl">The menu</h2>
          </div>
          <p className="tag !bg-white">
            <Clock className="h-3.5 w-3.5" /> {settings.hours}
          </p>
        </div>

        {!settings.open && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border-2 border-ink bg-gold-300 p-4 text-sm font-medium text-ink shadow-hard-sm">
            <Store className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <b>The canteen isn&apos;t taking orders right now.</b> You can still browse the menu. Timings: {settings.hours}.
            </p>
          </div>
        )}

        {/* Search + filters (sticky) */}
        <div className="sticky top-16 z-30 -mx-4 mt-6 border-b-2 border-transparent bg-cream-100/90 px-4 pb-3 pt-3 backdrop-blur-md sm:-mx-6 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${dishCount} dishes…`}
                className="input rounded-full !border-ink py-3.5 pl-11 pr-10 font-medium shadow-hard-sm"
                aria-label="Search the menu"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink/60 hover:bg-ink/5"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
            <div className="hidden gap-2 sm:flex">{toggles}</div>
          </div>
          <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
            <span className="flex shrink-0 gap-2 sm:hidden">
              {toggles}
              <span className="my-1 w-0.5 bg-ink/20" aria-hidden />
            </span>
            {filtered.map((s) => (
              <a key={s.id} href={`#cat-${s.id}`} className={clsx("chip", active === s.id && "chip-active")}>
                {s.name}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-10 lg:grid-cols-[220px_1fr]">
          {/* Desktop category rail */}
          <aside className="hidden lg:block">
            <nav className="sticky top-40 space-y-1">
              {filtered.map((s) => (
                <a
                  key={s.id}
                  href={`#cat-${s.id}`}
                  className={clsx(
                    "group flex items-center justify-between rounded-full border-2 px-4 py-2 font-display text-lg uppercase transition duration-200",
                    active === s.id ? "border-ink bg-brand-600 text-white shadow-hard-sm" : "border-transparent text-ink/60 hover:text-ink",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <ChevronRight
                      className={clsx("h-4 w-4 transition", active === s.id ? "translate-x-0" : "-translate-x-1 opacity-0 group-hover:opacity-100")}
                    />
                    {s.name}
                  </span>
                  <span className={clsx("font-sans text-xs font-bold", active === s.id ? "text-white/80" : "text-ink/40")}>{s.items.length}</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            {filtered.length === 0 && (
              <div className="card mt-4 p-10 text-center">
                <Search className="mx-auto h-9 w-9 text-brand-600" />
                <p className="mt-3 font-display text-2xl uppercase text-ink">No dishes match your search</p>
                <p className="text-sm text-zinc-500">Try another name or clear the filters.</p>
              </div>
            )}

            {filtered.map((section) => (
              <section key={section.id} id={`cat-${section.id}`} className="mb-10">
                <h2 className="flex items-center gap-3 pb-4 pt-6 font-display text-4xl uppercase text-ink sm:text-5xl">
                  {section.name}
                  <span className="tag !bg-white !px-2.5 !py-0.5 font-sans">{section.items.length}</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.items.map((dish, i) => (
                    <article key={dish.id} {...reveal("up", (i % 2) * 90)} className="card card-hover group flex gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <VegMark isVeg={dish.isVeg} />
                          {dish.isBestseller && (
                            <span className="tag !px-2 !py-0.5 !text-[10px] !shadow-none">
                              <Star className="h-3 w-3 fill-ink" /> Bestseller
                            </span>
                          )}
                        </div>
                        <h3
                          className={clsx(
                            "mt-3 font-display text-2xl uppercase leading-none",
                            dish.isAvailable ? "text-ink" : "text-zinc-400",
                          )}
                        >
                          {dish.name}
                        </h3>
                        <p className="mt-2 font-display text-2xl text-brand-600">₹{dish.price}</p>
                        {dish.description && <p className="mt-2 line-clamp-2 text-sm text-zinc-500">{dish.description}</p>}
                      </div>
                      <div className="relative shrink-0 pb-4">
                        <div className="overflow-hidden rounded-full border-2 border-ink">
                          <DishImage
                            name={dish.name}
                            emoji={dish.emoji}
                            imageUrl={dish.imageUrl}
                            className={clsx(
                              "h-28 w-28 transition duration-500 ease-out group-hover:rotate-6 group-hover:scale-110 sm:h-32 sm:w-32",
                              !dish.isAvailable && "opacity-50 grayscale",
                            )}
                          />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 flex justify-center">
                          {dish.isAvailable ? (
                            <AddControl dish={dish} disabled={!settings.open} />
                          ) : (
                            <span className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold uppercase text-zinc-500">
                              Sold out
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
      </div>

      {cart.ready && cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
          <Link
            href="/checkout"
            className="group flex w-full max-w-xl animate-page-in items-center justify-between rounded-full border-2 border-ink bg-brand-600 py-3 pl-7 pr-3 text-white shadow-hard transition duration-200 hover:-translate-y-0.5 hover:shadow-hard-lg"
          >
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-white/80">
                {cart.count} item{cart.count === 1 ? "" : "s"} added
              </span>
              <span className="block font-display text-2xl leading-none">₹{cart.total}</span>
            </span>
            <span className="flex items-center gap-2 rounded-full border-2 border-ink bg-gold-400 px-4 py-2 font-display text-lg uppercase text-ink">
              View cart <ArrowUpRight className="h-5 w-5 transition group-hover:rotate-45" />
            </span>
          </Link>
        </div>
      )}
    </main>
  );
}

function AddControl({ dish, disabled, compact, big }: { dish: MenuDish; disabled?: boolean; compact?: boolean; big?: boolean }) {
  const cart = useCart();
  const qty = cart.quantityOf(dish.id);
  const size = big ? "h-14 w-44 text-lg" : compact ? "h-8 w-[72px] text-xs" : "h-9 w-24 text-sm";
  const add = () => cart.add({ menuItemId: dish.id, name: dish.name, price: dish.price, isVeg: dish.isVeg, emoji: dish.emoji });

  if (qty === 0) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={add}
        className={clsx(
          "relative inline-flex items-center justify-center gap-1 rounded-full border-2 border-ink bg-white font-display uppercase tracking-wide text-ink shadow-hard-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gold-400 hover:shadow-hard active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-white",
          size,
        )}
        aria-label={`Add ${dish.name}`}
      >
        Add <Plus className={big ? "h-5 w-5" : "h-3.5 w-3.5"} strokeWidth={3} />
      </button>
    );
  }
  return (
    <div className={clsx("flex items-center justify-between rounded-full border-2 border-ink bg-brand-600 font-display text-white shadow-hard-sm", size)}>
      <button
        type="button"
        onClick={() => cart.decrement(dish.id)}
        className="flex h-full flex-1 items-center justify-center rounded-l-full hover:bg-brand-700"
        aria-label={`Remove one ${dish.name}`}
      >
        <Minus className="h-4 w-4" strokeWidth={3} />
      </button>
      <span key={qty} className="animate-pop" aria-live="polite">
        {qty}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={add}
        className="flex h-full flex-1 items-center justify-center rounded-r-full hover:bg-brand-700 disabled:opacity-60"
        aria-label={`Add one more ${dish.name}`}
      >
        <Plus className="h-4 w-4" strokeWidth={3} />
      </button>
    </div>
  );
}
