"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, Bike, Check, ChefHat, CircleX, Package, PartyPopper, Receipt, Store } from "lucide-react";
import { VegMark } from "@/components/VegMark";
import { api } from "@/lib/client";
import type { OrderStatus } from "@/lib/constants";
import { formatDateTime, formatTime } from "@/lib/format";
import { ACTIVE_STATUSES, ORDER_STATUS_META, TRACKING_STEPS, customerCanCancel } from "@/lib/orders";
import { OrderStatusBadge } from "./OrderStatusBadge";

export interface TrackedOrder {
  id: string;
  token: number;
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  isPaid: boolean;
  note: string | null;
  fulfilment: string;
  deliveryHostel: string | null;
  deliveryRoom: string | null;
  cancelReason: string | null;
  createdAt: string;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: { id: string; name: string; price: number; quantity: number; isVeg: boolean }[];
  user: { name: string };
}

const STEP_ICONS = { PLACED: Receipt, PREPARING: ChefHat, READY: Package, COMPLETED: PartyPopper } as const;

export function OrderTracker({ initial, justPlaced }: { initial: TrackedOrder; justPlaced: boolean }) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isActive = ACTIVE_STATUSES.includes(order.status);

  // Poll while the order is in progress.
  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(async () => {
      try {
        const data = await api<{ order: TrackedOrder }>(`/api/orders/${order.id}`);
        setOrder(data.order);
      } catch {
        // Network blip: try again on the next tick.
      }
    }, 5000);
    return () => clearInterval(t);
  }, [isActive, order.id]);

  async function cancel() {
    if (!window.confirm("Cancel this order?")) return;
    setCancelling(true);
    setError(null);
    try {
      const data = await api<{ order: TrackedOrder }>(`/api/orders/${order.id}/cancel`, { body: {} });
      setOrder(data.order);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not cancel");
    } finally {
      setCancelling(false);
    }
  }

  const stamps: Record<string, string | null> = {
    PLACED: order.createdAt,
    PREPARING: order.preparingAt,
    READY: order.readyAt,
    COMPLETED: order.completedAt,
  };
  const currentIndex = TRACKING_STEPS.indexOf(order.status);
  const delivery = order.fulfilment === "DELIVERY";
  const where = `Hostel ${order.deliveryHostel}, Room ${order.deliveryRoom}`;
  // Delivery orders reuse the same statuses; only the wording changes.
  const deliveryText: Partial<Record<OrderStatus, { label: string; hint: string }>> = {
    READY: { label: "Ready", hint: `On its way to ${where}` },
    COMPLETED: { label: "Delivered", hint: "Enjoy your meal!" },
  };
  const stepLabel = (s: OrderStatus) => (delivery && deliveryText[s]?.label) || ORDER_STATUS_META[s].label;
  const meta = { ...ORDER_STATUS_META[order.status], ...(delivery ? deliveryText[order.status] : {}) };

  return (
    <main className="page max-w-2xl">
      <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800">
        <ArrowLeft className="h-4 w-4" /> My orders
      </Link>

      {justPlaced && order.status === "PLACED" && (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
          Order placed! We&apos;ll update this page as the canteen works on it.
        </div>
      )}

      <section
        className={clsx(
          "relative mt-4 overflow-hidden rounded-[2rem] p-7 text-white shadow-lift",
          order.status === "CANCELLED"
            ? "bg-zinc-700"
            : order.status === "READY"
              ? "bg-gradient-to-br from-emerald-600 to-emerald-500"
              : "bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">{meta.label}</p>
            <h1 className="display mt-2 text-3xl sm:text-4xl">{meta.hint}</h1>
            <p className="mt-2 text-sm text-white/80">Placed {formatDateTime(order.createdAt)}</p>
          </div>
          <div className="shrink-0 rounded-3xl bg-gold-400 px-5 py-4 text-center text-ink shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-ink/70">Token</p>
            <p className="font-display text-5xl font-extrabold leading-none">{order.token}</p>
          </div>
        </div>
        {order.status === "READY" && (
          <p className="mt-4 rounded-2xl bg-white/15 p-3 text-sm font-semibold">
            {delivery
              ? `Your food is being brought to ${where}. Token #${order.token}.`
              : `Show token #${order.token} at the canteen counter to collect your food.`}
          </p>
        )}
        {order.status === "CANCELLED" && order.cancelReason && (
          <p className="mt-4 rounded-2xl bg-white/10 p-3 text-sm">Reason: {order.cancelReason}</p>
        )}
      </section>

      {order.status !== "CANCELLED" && (
        <section className="card mt-4 p-5">
          <ol className="relative">
            {TRACKING_STEPS.map((step, i) => {
              const done = i <= currentIndex;
              const Icon = STEP_ICONS[step as keyof typeof STEP_ICONS];
              const stamp = stamps[step];
              return (
                <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < TRACKING_STEPS.length - 1 && (
                    <span
                      className={clsx("absolute left-[17px] top-9 h-[calc(100%-36px)] w-0.5", i < currentIndex ? "bg-emerald-500" : "bg-zinc-200")}
                    />
                  )}
                  <span
                    className={clsx(
                      "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      done ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400",
                      i === currentIndex && isActive && "ring-4 ring-emerald-100",
                    )}
                  >
                    {done && i < currentIndex ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <div className="pt-1.5">
                    <p className={clsx("font-semibold", done ? "text-ink" : "text-zinc-400")}>{stepLabel(step)}</p>
                    {stamp && <p className="text-xs text-zinc-500">{formatTime(stamp)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <section className="card mt-4 p-5">
        <p className="mb-3 flex items-center gap-2 rounded-2xl bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700">
          {delivery ? <Bike className="h-4 w-4" /> : <Store className="h-4 w-4" />}
          {delivery ? `Delivery to ${where}` : "Pickup at the canteen counter"}
        </p>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">Order summary</h2>
          <OrderStatusBadge status={order.status} />
        </div>
        <ul className="mt-3 divide-y divide-zinc-100">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 py-2.5 text-sm">
              <VegMark isVeg={item.isVeg} className="scale-90" />
              <span className="flex-1 text-zinc-800">
                {item.name} <span className="text-zinc-400">× {item.quantity}</span>
              </span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </li>
          ))}
        </ul>
        {order.note && <p className="mt-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Note: {order.note}</p>}
        <div className="mt-3 flex justify-between border-t border-dashed border-zinc-200 pt-3 font-bold text-ink">
          <span>Total</span>
          <span>₹{order.total}</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Pay by {order.paymentMethod === "UPI" ? "UPI" : "cash"} {delivery ? "on delivery" : "at the counter"} · {order.isPaid ? "Paid ✓" : "Not paid yet"}
        </p>
      </section>

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {customerCanCancel(order.status) && (
        <button onClick={cancel} disabled={cancelling} className="btn-danger mt-4 w-full">
          <CircleX className="h-4 w-4" /> {cancelling ? "Cancelling…" : "Cancel order"}
        </button>
      )}
      {!isActive && (
        <Link href="/" className="btn-secondary mt-4 w-full">
          Order something else
        </Link>
      )}
    </main>
  );
}
