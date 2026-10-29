"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Boxes, ClipboardCheck, ClipboardList, LayoutDashboard, Truck, Users, UtensilsCrossed } from "lucide-react";

const LINKS = [
  { href: "/staff", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/staff/orders", label: "Live orders", Icon: ClipboardList },
  { href: "/staff/menu", label: "Canteen menu", Icon: UtensilsCrossed },
  { href: "/staff/inventory", label: "Inventory", Icon: Boxes },
  { href: "/staff/inventory/count", label: "Daily stock count", Icon: ClipboardCheck },
  { href: "/staff/inventory/restock", label: "Restock list", Icon: Truck },
  { href: "/staff/users", label: "Users & roles", Icon: Users, adminOnly: true },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/staff/inventory") {
    return pathname === href || (pathname.startsWith(`${href}/`) && !/\/(count|restock)$/.test(pathname));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => !l.adminOnly || isAdmin);
  return (
    <nav className="print:hidden lg:w-56 lg:shrink-0">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-3 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:px-0">
        <p className="label hidden px-3 lg:block">Mess staff</p>
        {links.map(({ href, label, Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition",
              isActive(pathname, href, exact) ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
