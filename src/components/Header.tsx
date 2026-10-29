"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { LayoutDashboard, LogOut, Receipt, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { useCart } from "./CartProvider";
import { api } from "@/lib/client";
import type { Role } from "@/lib/constants";

export interface HeaderUser {
  name: string;
  role: Role;
}

export function Header({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [loggingOut, setLoggingOut] = useState(false);
  const staff = user?.role === "STAFF" || user?.role === "ADMIN";
  const inStaffArea = pathname.startsWith("/staff");

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
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition",
        active ? "bg-brand-50 text-brand-700" : "text-zinc-600 hover:bg-zinc-100",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-lg text-white shadow-sm">
            🍽️
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[15px] font-extrabold tracking-tight text-zinc-900">IIMS Canteen</span>
            <span className="block truncate text-[11px] font-medium text-zinc-500">Mess &amp; Canteen · IIM Sambalpur</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLink("/", "Canteen", UtensilsCrossed, pathname === "/")}
          {user && navLink("/orders", "My orders", Receipt, pathname.startsWith("/orders"))}
          {staff && navLink("/staff", "Staff", LayoutDashboard, inStaffArea)}
          {!inStaffArea && (
            <Link
              href="/checkout"
              className="relative inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              {ready && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          )}
          {user ? (
            <div className="ml-1 flex items-center gap-1 border-l border-zinc-200 pl-2">
              <span
                className="hidden h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold uppercase text-zinc-600 md:flex"
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
