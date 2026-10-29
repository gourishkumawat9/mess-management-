"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ArrowLeft, Banknote, LoaderCircle, Minus, Plus, Smartphone, Store, TriangleAlert } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { VegMark } from "@/components/VegMark";
import { api } from "@/lib/client";
import type { PaymentMethod } from "@/lib/constants";
import { DishImage } from "./DishImage";

type MenuIndex = Record<string, { name: string; price: number; available: boolean }>;

export function CheckoutView({
  menu,
  open,
  hours,
  userName,
}: {
  menu: MenuIndex;
  open: boolean;
  hours: string;
  userName: string;
}) {
  const router = useRouter();
  const cart = useCart();
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("UPI");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refresh names and prices in a saved cart from the live menu.
  const { ready, lines, setLines } = cart;
  useEffect(() => {
    if (!ready) return;
    const updated = lines.map((l) => (menu[l.menuItemId] ? { ...l, name: menu[l.menuItemId].name, price: menu[l.menuItemId].price } : l));
    if (updated.some((l, i) => l.price !== lines[i].price || l.name !== lines[i].name)) setLines(updated);
  }, [ready, lines, menu, setLines]);

  const unavailable = cart.lines.filter((l) => !menu[l.menuItemId]?.available);

  async function placeOrder() {
    setPlacing(true);
    setError(null);
    try {
      const { order } = await api<{ order: { id: string } }>("/api/orders", {
        body: {
          items: cart.lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity })),
          paymentMethod: payment,
          note,
        },
      });
      cart.clear();
      router.push(`/orders/${order.id}?placed=1`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place the order");
      setPlacing(false);
    }
  }

  if (!cart.ready) {
    return <main className="page max-w-2xl" />;
  }

  if (cart.lines.length === 0) {
    return (
      <main className="page max-w-2xl">
        <div className="card mt-6 p-10 text-center">
          <p className="text-5xl">🛍️</p>
          <h1 className="mt-3 text-xl font-bold text-zinc-900">Your cart is empty</h1>
          <p className="mt-1 text-sm text-zinc-500">Add something tasty from the canteen menu.</p>
          <Link href="/" className="btn-primary mt-5">
            Browse the menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page max-w-2xl">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800">
        <ArrowLeft className="h-4 w-4" /> Back to menu
      </Link>
      <h1 className="page-title mt-3">Your order</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
        <Store className="h-4 w-4" /> Pickup from the mess canteen counter
      </p>

      {!open && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The canteen isn&apos;t taking orders right now. Timings: {hours}.
        </div>
      )}

      <section className="card mt-5 divide-y divide-zinc-100">
        {cart.lines.map((line) => {
          const isUnavailable = !menu[line.menuItemId]?.available;
          return (
            <div key={line.menuItemId} className="flex items-start gap-3 p-4">
              <DishImage name={line.name} emoji={line.emoji} size="sm" className="h-12 w-12 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-1.5">
                  <VegMark isVeg={line.isVeg} className="mt-0.5 scale-90" />
                  <p className={clsx("line-clamp-2 font-semibold leading-snug", isUnavailable ? "text-zinc-400 line-through" : "text-zinc-900")}>
                    {line.name}
                  </p>
                </div>
                <p className="text-sm text-zinc-500">
                  ₹{line.price}
                  {isUnavailable && <span className="ml-2 font-semibold text-red-600">Not available now</span>}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
              <div className="flex h-9 w-24 items-center justify-between rounded-lg border border-brand-200 bg-brand-50 font-bold text-brand-700">
                <button
                  onClick={() => cart.decrement(line.menuItemId)}
                  className="flex h-full flex-1 items-center justify-center"
                  aria-label={`Remove one ${line.name}`}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span>{line.quantity}</span>
                <button
                  onClick={() => cart.add(line)}
                  disabled={isUnavailable}
                  className="flex h-full flex-1 items-center justify-center disabled:opacity-40"
                  aria-label={`Add one more ${line.name}`}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm font-semibold text-zinc-900">₹{line.price * line.quantity}</p>
              </div>
            </div>
          );
        })}
        <div className="p-4">
          <Link href="/" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            + Add more items
          </Link>
        </div>
      </section>

      <section className="card mt-4 p-4">
        <label htmlFor="note" className="label">
          Note for the kitchen (optional)
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 200))}
          rows={2}
          placeholder="e.g. less spicy, no onion, extra cheese"
          className="input resize-none"
        />
      </section>

      <section className="card mt-4 p-4">
        <p className="label">Payment at the counter</p>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { id: "UPI", label: "UPI", hint: "Scan the QR at pickup", Icon: Smartphone },
              { id: "CASH", label: "Cash", hint: "Pay when you collect", Icon: Banknote },
            ] as const
          ).map(({ id, label, hint, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPayment(id)}
              className={clsx(
                "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                payment === id ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600" : "border-zinc-200 hover:border-zinc-300",
              )}
              aria-pressed={payment === id}
            >
              <Icon className={clsx("mt-0.5 h-5 w-5", payment === id ? "text-brand-600" : "text-zinc-400")} />
              <span>
                <span className="block font-semibold text-zinc-900">{label}</span>
                <span className="block text-xs text-zinc-500">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="card mt-4 p-4">
        <p className="label">Bill details</p>
        <div className="flex justify-between text-sm text-zinc-600">
          <span>Item total</span>
          <span>₹{cart.total}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-zinc-600">
          <span>Packaging &amp; service</span>
          <span className="font-medium text-emerald-600">FREE</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-dashed border-zinc-200 pt-3 text-base font-bold text-zinc-900">
          <span>To pay</span>
          <span>₹{cart.total}</span>
        </div>
      </section>

      {(error || unavailable.length > 0) && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {error ?? `Remove ${unavailable.map((l) => l.name).join(", ")} from your cart to continue.`}
          </span>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-6 bg-gradient-to-t from-stone-50 via-stone-50 to-stone-50/0 px-4 pb-4 pt-6 sm:-mx-6 sm:px-6">
        <button
          onClick={placeOrder}
          disabled={placing || !open || unavailable.length > 0}
          className="btn-primary w-full rounded-2xl py-4 text-base shadow-xl shadow-brand-600/20"
        >
          {placing ? <LoaderCircle className="h-5 w-5 animate-spin" /> : null}
          {placing ? "Placing order…" : `Place order · ₹${cart.total}`}
        </button>
        <p className="mt-2 text-center text-xs text-zinc-500">Ordering as {userName}</p>
      </div>
    </main>
  );
}
