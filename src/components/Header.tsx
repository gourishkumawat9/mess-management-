"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { LayoutDashboard, LogOut, Receipt, ShoppingBag, UtensilsCrossed } from "lucide-react";
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

  // Transparent over the page at the top, a solid frosted bar once you scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
        "group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition duration-300 sm:px-3.5",
        active ? "bg-brand-600 text-white shadow-sm shadow-brand-900/20" : "text-ink/75 hover:bg-brand-50 hover:text-brand-700",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-500 ease-out print:hidden",
        scrolled
          ? "border-b border-brand-950/5 bg-cream-50/85 shadow-[0_8px_30px_-12px_rgba(51,6,14,0.18)] backdrop-blur-lg"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm shadow-brand-900/30 transition duration-500 ease-out group-hover:-rotate-6 group-hover:scale-105">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[15px] font-extrabold tracking-tight text-ink sm:text-[17px]">IIMS Canteen</span>
            <span className="hidden truncate text-[11px] font-medium text-brand-900/60 sm:block">Mess &amp; Canteen · IIM Sambalpur</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLink("/", "Canteen", UtensilsCrossed, pathname === "/")}
          {user && navLink("/orders", "My orders", Receipt, pathname.startsWith("/orders"))}
          {staff && navLink("/staff", "Staff", LayoutDashboard, inStaffArea)}
          {!inStaffArea && (
            <Link
              href="/checkout"
              className={clsx(
                "relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-semibold transition duration-300 sm:px-3.5",
                pathname === "/checkout" ? "bg-brand-600 text-white" : "text-ink/75 hover:bg-brand-50 hover:text-brand-700",
              )}
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {ready && count > 0 && (
                <span
                  key={count}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-pop items-center justify-center rounded-full bg-gold-400 px-1 text-[11px] font-bold text-ink ring-2 ring-cream-50"
                >
                  {count}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <div className="ml-1 flex items-center gap-1 border-l border-brand-950/10 pl-2">
              <span
                className="hidden h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold uppercase text-brand-800 md:flex"
                title={user.name}
              >
                {user.name.slice(0, 1)}
              </span>
              <button onClick={logout} disabled={loggingOut} className="btn-ghost btn-sm" title="Log out" aria-label="Log out">
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Log out</span>
              </button>
            </div>
          ) : (
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn-primary btn-sm ml-1 whitespace-nowrap">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
