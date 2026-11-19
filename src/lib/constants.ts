// Allowed values for the string "enum" columns in prisma/schema.prisma.

// Who can do what:
//   USER    - students, faculty, staff: order from the canteen
//   CANTEEN - canteen counter: live orders, canteen menu, open/close
//   ADMIN   - the owner: everything, plus users & roles
// (Older databases may still hold MESS or STAFF; a migration turns those into
// USER and CANTEEN.)
export const ROLES = ["USER", "CANTEEN", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Student / Member",
  CANTEEN: "Canteen staff",
  ADMIN: "Owner / Admin",
};

/** Anyone with a staff dashboard. */
export const STAFF_ROLES: Role[] = ["CANTEEN", "ADMIN"];
/** Canteen orders, canteen menu and the open/close switch. */
export const CANTEEN_ROLES: Role[] = ["CANTEEN", "ADMIN"];

export function hasRole(role: Role | undefined | null, roles: readonly Role[]) {
  return !!role && roles.includes(role);
}

export const FULFILMENTS = ["PICKUP", "DELIVERY"] as const;
export type Fulfilment = (typeof FULFILMENTS)[number];

// AWAITING_PAYMENT: an online order whose payment hasn't been confirmed by
// Razorpay yet. The kitchen never sees these.
export const ORDER_STATUSES = ["AWAITING_PAYMENT", "PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

// ONLINE: paid in the app through Razorpay (UPI, cards, wallets) before the
//         kitchen sees the order.
// COUNTER: cash or UPI QR at the counter / on delivery; staff tick "paid".
// Older orders may say CASH or UPI; both mean paid at the counter.
export const PAYMENT_METHODS = ["ONLINE", "COUNTER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function paymentLabel(method: string) {
  return method === "ONLINE" ? "Paid online" : "Pay at counter";
}

/** An online order not paid within this many minutes is cancelled. */
export const PAYMENT_WINDOW_MINUTES = 15;

export const SETTINGS = {
  canteenOpen: "canteen_open",
  canteenHours: "canteen_hours",
} as const;

export const DEFAULT_CANTEEN_HOURS = "9:00 PM – 4:00 AM";

// Ordering guard rails.
export const MAX_ITEM_QUANTITY = 20;
export const MAX_ORDER_LINES = 30;
export const MAX_ACTIVE_ORDERS_PER_USER = 3;
