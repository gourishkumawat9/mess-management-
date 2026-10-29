// Pure canteen order rules: status flow, labels and the IST day boundary.

import type { OrderStatus } from "./constants";

/** Which statuses the counter staff can move an order to from each status. */
export const ORDER_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const ACTIVE_STATUSES: OrderStatus[] = ["PLACED", "PREPARING", "READY"];

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; hint: string; next?: string }> = {
  PLACED: { label: "Order placed", hint: "Waiting for the canteen to start on it", next: "Start preparing" },
  PREPARING: { label: "Being prepared", hint: "Your food is on the stove", next: "Mark ready" },
  READY: { label: "Ready for pickup", hint: "Collect it at the canteen counter", next: "Picked up" },
  COMPLETED: { label: "Picked up", hint: "Enjoy your meal!" },
  CANCELLED: { label: "Cancelled", hint: "This order was cancelled" },
};

/** The happy path, used to draw the tracking stepper. */
export const TRACKING_STEPS: OrderStatus[] = ["PLACED", "PREPARING", "READY", "COMPLETED"];

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_FLOW[from].includes(to);
}

export function nextStatus(from: OrderStatus): OrderStatus | null {
  return ORDER_FLOW[from].find((s) => s !== "CANCELLED") ?? null;
}

/** Customers may cancel only before the kitchen has started cooking. */
export function customerCanCancel(status: OrderStatus) {
  return status === "PLACED";
}

export function statusTimestampField(status: OrderStatus) {
  switch (status) {
    case "PREPARING":
      return "preparingAt" as const;
    case "READY":
      return "readyAt" as const;
    case "COMPLETED":
      return "completedAt" as const;
    case "CANCELLED":
      return "cancelledAt" as const;
    default:
      return null;
  }
}

const IST_OFFSET_MS = 330 * 60 * 1000; // UTC+5:30, no daylight saving

/** Midnight in India for the given instant, as a UTC Date. Token numbers reset here. */
export function startOfDayIST(now: Date) {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

export interface PricedLine {
  price: number;
  quantity: number;
}

export function orderTotal(lines: PricedLine[]) {
  return lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
}
