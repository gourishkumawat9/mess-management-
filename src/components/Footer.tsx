"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, MapPin, UtensilsCrossed } from "lucide-react";
import { Marquee } from "./motion/Marquee";

// Deep maroon footer with a big wordmark, shown on the student-facing pages.
export function Footer() {
  const pathname = usePathname();
  if (pathname.startsWith("/staff")) return null;
  return (
    <footer className="relative mt-10 overflow-hidden bg-brand-950 text-cream-100 print:hidden">
      <Marquee
        className="border-y border-white/10 bg-brand-600 py-3 font-display text-lg font-bold uppercase tracking-wide text-white"
        items={["Order ahead", "Skip the queue", "Hot & fresh", "Pickup or room delivery", "Pay by cash or UPI"]}
      />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600">
            <UtensilsCrossed className="h-6 w-6" />
          </span>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream-100/70">
            The mess canteen of the Indian Institute of Management Sambalpur, now on your phone. Order, track and collect,
            while the mess team keeps the kitchen stocked from the same app.
          </p>
        </div>
        <div className="text-sm">
          <p className="label !text-gold-300">Find us</p>
          <p className="mt-3 flex gap-2 text-cream-100/80">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> Mess building, IIM Sambalpur campus, Sambalpur, Odisha
          </p>
          <p className="mt-3 flex gap-2 text-cream-100/80">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> Timings shown on the canteen page
          </p>
        </div>
        <div className="text-sm">
          <p className="label !text-gold-300">Quick links</p>
          <ul className="mt-3 space-y-2">
            {[
              ["/", "Canteen menu"],
              ["/checkout", "Your cart"],
              ["/orders", "My orders"],
              ["/login", "Log in"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-cream-100/80 transition hover:text-white hover:underline hover:underline-offset-4">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p
        aria-hidden
        className="pointer-events-none -mb-[0.18em] select-none whitespace-nowrap px-2 text-center font-display text-[14.5vw] font-extrabold leading-none tracking-tighter text-white/[0.06]"
      >
        IIMS Canteen
      </p>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-cream-100/50 sm:px-6">
          © IIM Sambalpur Mess &amp; Canteen · Photos from Unsplash, see PHOTO_CREDITS.md
        </p>
      </div>
    </footer>
  );
}
