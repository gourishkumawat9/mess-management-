"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowUpRight, LayoutDashboard, LogOut, Receipt, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Marquee } from "./motion/Marquee";
import { useCart } from "./CartProvider";
import { api } from "@/lib/client";
import { STAFF_ROLES, hasRole, type Role } from "@/lib/constants";

export interface HeaderUser {
  name: string;
  role: Role;
}

export function Header({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [loggingOut, setLoggingOut] = useState(false);
  const staff = hasRole(user?.role, STAFF_ROLES);
  const inStaffArea = pathname.startsWith("/staff");
  const [scrolled, setScrolled] = useState(false);

  // Transparent over the page at the top, a solid inked bar once you scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await api("/api/auth/logout", { body: {} });
      window.location.assign("/");
    } catch {
      setLoggingOut(false);
    }
  }

  const navLink = (href: string, label: string, Icon: typeof Receipt, active: boolean) => (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={clsx(
        "group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[13px] font-extrabold uppercase tracking-wide transition duration-200 sm:px-3.5",
        active ? "bg-ink text-cream-50" : "text-ink hover:bg-gold-300",
      )}
    >
      <Icon className="h-4 w-4 sm:hidden" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <>
      {!inStaffArea && (
        <Marquee
          className="border-b-2 border-ink bg-ink py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-cream-50 print:hidden"
          separatorClassName="text-gold-400"
          items={[
            "Late night cravings, sorted",
            "Order ahead, skip the queue",
            "Delivery to your hostel room",
            "Pay by cash or UPI",
            "Good food, good mood",
          ]}
        />
      )}
      <header
        className={clsx(
          "sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300 print:hidden",
          scrolled || inStaffArea
            ? "border-b-2 border-ink bg-cream-100/90 backdrop-blur-md"
            : "border-b-2 border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link href="/" className="group flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 -rotate-6 items-center justify-center rounded-full border-2 border-ink bg-brand-600 text-white shadow-hard-sm transition duration-300 group-hover:rotate-6 group-hover:scale-105">
              <UtensilsCrossed className="h-5 w-5" />
            </span>
            <span className="min-w-0 leading-none">
              <span className="block truncate font-display text-[22px] uppercase leading-none text-ink">IIMS Canteen</span>
              <span className="mt-0.5 hidden truncate text-[10px] font-bold uppercase tracking-[0.18em] text-ink/55 sm:block">
                Mess &amp; Canteen · IIM Sambalpur
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {navLink("/", "Menu", UtensilsCrossed, pathname === "/")}
            {user && navLink("/orders", "My orders", Receipt, pathname.startsWith("/orders"))}
            {staff && navLink("/staff", "Staff", LayoutDashboard, inStaffArea)}
            {!inStaffArea && (
              <Link
                href="/checkout"
                className={clsx(
                  "relative ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink transition duration-200 hover:-translate-y-0.5",
                  pathname === "/checkout" ? "bg-ink text-cream-50" : "bg-white text-ink shadow-hard-sm hover:shadow-hard",
                )}
                aria-label={`Cart, ${count} items`}
                title="Cart"
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                {ready && count > 0 && (
                  <span
                    key={count}
                    className="absolute -right-2 -top-2 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full border-2 border-ink bg-gold-400 px-1 text-[10px] font-extrabold text-ink"
                  >
                    {count}
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <button
                onClick={logout}
                disabled={loggingOut}
                className="ml-1 inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-extrabold uppercase tracking-wide text-ink/70 transition hover:bg-ink/5 hover:text-ink"
                title={`Log out ${user.name}`}
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Log out</span>
              </button>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(pathname)}`}
                className="btn-primary btn-sm ml-2 whitespace-nowrap px-4 py-2 uppercase tracking-wide"
              >
                Log in <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
