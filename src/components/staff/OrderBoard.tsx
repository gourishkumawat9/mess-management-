"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Bell, BellOff, RefreshCw, X } from "lucide-react";
import { OrderStatusBadge } from "@/components/canteen/OrderStatusBadge";
import { VegMark } from "@/components/VegMark";
import { CanteenToggle } from "./CanteenToggle";
import { api } from "@/lib/client";
import type { OrderStatus } from "@/lib/constants";
import { formatTime, timeAgo } from "@/lib/format";
import { ORDER_STATUS_META, nextStatus } from "@/lib/orders";

interface BoardOrder {
  id: string;
  token: number;
  status: OrderStatus;
  total: number;
  paymentMethod: string;
  isPaid: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  items: { id: string; name: string; quantity: number; isVeg: boolean }[];
  user: { name: string; phone: string | null };
}

interface BoardData {
  active: BoardOrder[];
  done: BoardOrder[];
}

const COLUMNS: { status: OrderStatus; title: string; tone: string }[] = [
  { status: "PLACED", title: "New", tone: "bg-sky-500" },
  { status: "PREPARING", title: "Preparing", tone: "bg-amber-500" },
  { status: "READY", title: "Ready for pickup", tone: "bg-emerald-500" },
];

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Audio not allowed; the board still updates visually.
  }
}

export function OrderBoard({ initial, open }: { initial: BoardData; open: boolean }) {
  const [data, setData] = useState(initial);
  const [now, setNow] = useState(() => new Date());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const seen = useRef(new Set(initial.active.map((o) => o.id)));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await api<BoardData>("/api/staff/orders");
      const newOnes = fresh.active.filter((o) => !seen.current.has(o.id));
      fresh.active.forEach((o) => seen.current.add(o.id));
      if (newOnes.length > 0 && sound) beep();
      setData(fresh);
      setNow(new Date());
    } catch {
      // Keep showing the last good data.
    } finally {
      setRefreshing(false);
    }
  }, [sound]);

  useEffect(() => {
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [refresh]);

  async function update(order: BoardOrder, body: { status?: OrderStatus; isPaid?: boolean; cancelReason?: string }) {
    setBusyId(order.id);
    setError(null);
    try {
      await api(`/api/staff/orders/${order.id}`, { method: "PATCH", body });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the order");
    } finally {
      setBusyId(null);
    }
  }

  function cancel(order: BoardOrder) {
    const reason = window.prompt(`Cancel token #${order.token}? Reason (shown to ${order.user.name}):`, "Item ran out");
    if (reason === null) return;
    update(order, { status: "CANCELLED", cancelReason: reason || "Cancelled by canteen" });
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="page-title">Live orders</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
            <RefreshCw className={clsx("h-3.5 w-3.5", refreshing && "animate-spin")} /> Updates every 5 seconds
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (!sound) beep();
              setSound((s) => !s);
            }}
            className={clsx("btn-secondary", sound && "text-brand-700 ring-brand-200")}
            aria-pressed={sound}
          >
            {sound ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            {sound ? "Sound on" : "Sound off"}
          </button>
          <CanteenToggle open={open} />
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const orders = data.active.filter((o) => o.status === col.status);
          return (
            <section key={col.status} className="rounded-3xl bg-zinc-100/80 p-3">
              <h2 className="flex items-center gap-2 px-1 pb-3 text-sm font-bold text-zinc-700">
                <span className={clsx("h-2.5 w-2.5 rounded-full", col.tone)} />
                {col.title}
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs text-zinc-600">{orders.length}</span>
              </h2>
              <div className="space-y-3">
                {orders.length === 0 && <p className="px-1 py-6 text-center text-sm text-zinc-400">Nothing here</p>}
                {orders.map((order) => {
                  const next = nextStatus(order.status);
                  return (
                    <article key={order.id} className="card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Token</p>
                          <p className="text-3xl font-black leading-none text-zinc-900">#{order.token}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-zinc-900">{order.user.name}</p>
                          <p className="text-xs text-zinc-500" suppressHydrationWarning>
                            {formatTime(order.createdAt)} · {timeAgo(order.createdAt, now)}
                          </p>
                          {order.user.phone && <p className="text-xs text-zinc-500">{order.user.phone}</p>}
                        </div>
                      </div>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {order.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-2">
                            <VegMark isVeg={item.isVeg} className="scale-90" />
                            <span className="font-bold text-zinc-900">{item.quantity} ×</span>
                            <span className="text-zinc-800">{item.name}</span>
                          </li>
                        ))}
                      </ul>
                      {order.note && (
                        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">“{order.note}”</p>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-dashed border-zinc-200 pt-3 text-sm">
                        <span className="font-semibold text-zinc-900">
                          ₹{order.total} <span className="font-normal text-zinc-500">· {order.paymentMethod}</span>
                        </span>
                        <button
                          onClick={() => update(order, { isPaid: !order.isPaid })}
                          disabled={busyId === order.id}
                          className={clsx(
                            "rounded-lg px-2.5 py-1 text-xs font-semibold ring-1",
                            order.isPaid ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-white text-zinc-600 ring-zinc-200 hover:bg-zinc-50",
                          )}
                        >
                          {order.isPaid ? "Paid ✓" : "Mark paid"}
                        </button>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {next && (
                          <button
                            onClick={() => update(order, { status: next })}
                            disabled={busyId === order.id}
                            className={clsx("btn flex-1 text-white", order.status === "READY" ? "bg-zinc-900 hover:bg-zinc-800" : "bg-brand-600 hover:bg-brand-700")}
                          >
                            {ORDER_STATUS_META[order.status].next}
                          </button>
                        )}
                        <button onClick={() => cancel(order)} disabled={busyId === order.id} className="btn-secondary px-3" aria-label={`Cancel token ${order.token}`} title="Cancel order">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className="card mt-6 overflow-hidden">
        <h2 className="border-b border-zinc-100 p-4 font-bold text-zinc-900">Finished today</h2>
        {data.done.length === 0 ? (
          <p className="p-6 text-center text-sm text-zinc-500">No finished orders yet today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-zinc-100">
                {data.done.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-bold text-zinc-900">#{o.token}</td>
                    <td className="px-4 py-3 text-zinc-700">{o.user.name}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {(() => {
                        const n = o.items.reduce((sum, i) => sum + i.quantity, 0);
                        return `${n} item${n === 1 ? "" : "s"}`;
                      })()}
                    </td>
                    <td className="px-4 py-3 font-semibold">₹{o.total}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">{formatTime(o.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
