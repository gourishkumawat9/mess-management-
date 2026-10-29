import clsx from "clsx";
import type { OrderStatus } from "@/lib/constants";
import { ORDER_STATUS_META } from "@/lib/orders";

const STYLES: Record<OrderStatus, string> = {
  PLACED: "bg-sky-50 text-sky-700 ring-sky-200",
  PREPARING: "bg-amber-50 text-amber-700 ring-amber-200",
  READY: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  COMPLETED: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  CANCELLED: "bg-red-50 text-red-600 ring-red-200",
};

export function OrderStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = status as OrderStatus;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        STYLES[s] ?? STYLES.COMPLETED,
        className,
      )}
    >
      {(s === "PLACED" || s === "PREPARING" || s === "READY") && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {ORDER_STATUS_META[s]?.label ?? status}
    </span>
  );
}
