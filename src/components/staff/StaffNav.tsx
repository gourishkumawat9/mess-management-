"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Boxes, ClipboardCheck, ClipboardList, LayoutDashboard, Truck, Users, UtensilsCrossed } from "lucide-react";
import { CANTEEN_ROLES, MESS_ROLES, ROLE_LABELS, hasRole, type Role } from "@/lib/constants";

// Each team only sees its own pages; the owner (ADMIN) sees all of them.
const LINKS: { href: string; label: string; Icon: typeof Users; exact?: boolean; roles?: Role[] }[] = [
  { href: "/staff", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/staff/orders", label: "Live orders", Icon: ClipboardList, roles: CANTEEN_ROLES },
  { href: "/staff/menu", label: "Canteen menu", Icon: UtensilsCrossed, roles: CANTEEN_ROLES },
  { href: "/staff/inventory", label: "Inventory", Icon: Boxes, roles: MESS_ROLES },
  { href: "/staff/inventory/count", label: "Daily stock count", Icon: ClipboardCheck, roles: MESS_ROLES },
  { href: "/staff/inventory/restock", label: "Restock list", Icon: Truck, roles: MESS_ROLES },
  { href: "/staff/users", label: "Users & roles", Icon: Users, roles: ["ADMIN"] },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  if (href === "/staff/inventory") {
    return pathname === href || (pathname.startsWith(`${href}/`) && !/\/(count|restock)$/.test(pathname));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StaffNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const links = LINKS.filter((l) => !l.roles || hasRole(role, l.roles));
  return (
    <nav className="print:hidden lg:w-56 lg:shrink-0">
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-3 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:rounded-[1.5rem] lg:border-2 lg:border-ink lg:bg-ink lg:p-3 lg:shadow-hard">
        <p className="label hidden px-3 pb-1 pt-2 lg:block lg:!text-gold-300">{ROLE_LABELS[role]}</p>
        {links.map(({ href, label, Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              "inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition duration-300",
              isActive(pathname, href, exact)
                ? "border-2 border-ink bg-brand-600 text-white lg:border-brand-600"
                : "border-2 border-transparent text-ink/70 hover:bg-brand-50 hover:text-brand-700 lg:text-white/70 lg:hover:bg-white/10 lg:hover:text-white",
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
