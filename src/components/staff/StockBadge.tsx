import clsx from "clsx";
import { STATUS_META, type StockStatus } from "@/lib/inventory";

const STYLES: Record<StockStatus, string> = {
  OUT: "bg-red-600 text-white ring-red-600",
  LOW: "bg-red-50 text-red-700 ring-red-200",
  RUNNING_OUT: "bg-amber-50 text-amber-800 ring-amber-200",
  OK: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function StockBadge({ status, className }: { status: StockStatus; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", STYLES[status], className)}>
      {STATUS_META[status].label}
    </span>
  );
}

export function ExpiryBadge() {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
      Check freshness
    </span>
  );
}
