"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Clock, MapPin, Play } from "lucide-react";
import { Marquee } from "./motion/Marquee";

// Big red footer: a shout-out headline, play-arrow links and a giant outlined
// wordmark. Shown on the student-facing pages only.
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/staff")) return null;
  return (
    <footer className="relative mt-16 overflow-hidden border-t-2 border-ink bg-brand-600 text-cream-50 print:hidden">
      <Marquee
        className="border-b-2 border-ink bg-gold-400 py-3 font-display text-2xl uppercase text-ink"
        separatorClassName="text-brand-600"
        items={["Maggi mania", "Manchurian", "Noodles", "Egg items", "Wraps & rolls", "Good food, good mood"]}
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="scribble text-3xl text-gold-300">Hungry at 2 AM?</p>
          <h2 className="display mt-2 text-6xl sm:text-7xl">Late night cravings, sorted.</h2>
          <Link href="/#menu" className="btn-secondary btn-xl mt-8">
            Order now <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold-300">Jump to</p>
          <ul className="mt-4 space-y-2">
            {[
              ["/#menu", "Canteen menu"],
              ["/checkout", "Your cart"],
              ["/orders", "My orders"],
              ["/login", "Log in"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group inline-flex items-center gap-3 font-display text-2xl uppercase transition hover:text-gold-300"
                >
                  <Play className="h-4 w-4 fill-current transition duration-300 group-hover:translate-x-1" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-gold-300">Find us</p>
          <p className="mt-4 flex gap-2 font-medium text-cream-50/90">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> Mess building, IIM Sambalpur campus, Sambalpur, Odisha
          </p>
          <p className="mt-3 flex gap-2 font-medium text-cream-50/90">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> Timings are on the menu page
          </p>
        </div>
      </div>
      <p
        aria-hidden
        className="text-outline-cream pointer-events-none -mb-[0.12em] select-none whitespace-nowrap text-center font-display text-[16vw] uppercase leading-none opacity-60"
      >
        IIMS Canteen
      </p>
      <div className="border-t-2 border-ink bg-ink">
        <p className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-4 text-xs font-medium text-cream-50/60 sm:px-6">
          <span>© IIM Sambalpur Mess &amp; Canteen</span>
          <span>Good food · Good mood</span>
        </p>
      </div>
    </footer>
  );
}
