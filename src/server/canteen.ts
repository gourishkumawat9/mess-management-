import "server-only";
import { prisma } from "@/lib/db";
import { HttpError } from "@/lib/api";
import type { CurrentUser } from "@/lib/auth";
import {
  DEFAULT_CANTEEN_HOURS,
  MAX_ACTIVE_ORDERS_PER_USER,
  MAX_ITEM_QUANTITY,
  CANTEEN_ROLES,
  PAYMENT_WINDOW_MINUTES,
  SETTINGS,
  hasRole,
  type Fulfilment,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/constants";
import { isWithinHours } from "@/lib/hours";
import {
  ACTIVE_STATUSES,
  canTransition,
  customerCanCancel,
  orderTotal,
  istDateKey,
  startOfDayIST,
  statusTimestampField,
} from "@/lib/orders";
import {
  capturePayment,
  createRazorpayOrder,
  fetchPayment,
  paymentOptions,
  razorpayKeyId,
  refundPayment,
  toPaise,
  type RazorpayPayment,
} from "./payments";

// ---------------------------------------------------------------- settings

/**
 * `switchOn` is the staff open/closed switch. `open` (taking orders now) also
 * needs the current India time to be inside the canteen timings.
 */
export async function getCanteenSettings() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [SETTINGS.canteenOpen, SETTINGS.canteenHours] } },
  });
  const value = (key: string) => rows.find((r) => r.key === key)?.value;
  const switchOn = value(SETTINGS.canteenOpen) !== "false";
  const hours = value(SETTINGS.canteenHours) ?? DEFAULT_CANTEEN_HOURS;
  const inHours = isWithinHours(hours, new Date());
  return { open: switchOn && inHours, switchOn, inHours, hours };
}

export async function updateCanteenSettings(input: { canteenOpen?: boolean; canteenHours?: string }) {
  const writes = [];
  if (input.canteenOpen !== undefined) {
    const value = String(input.canteenOpen);
    writes.push(
      prisma.setting.upsert({
        where: { key: SETTINGS.canteenOpen },
        create: { key: SETTINGS.canteenOpen, value },
        update: { value },
      }),
    );
  }
  if (input.canteenHours !== undefined) {
    const value = input.canteenHours;
    writes.push(
      prisma.setting.upsert({
        where: { key: SETTINGS.canteenHours },
        create: { key: SETTINGS.canteenHours, value },
        update: { value },
      }),
    );
  }
  await prisma.$transaction(writes);
  return getCanteenSettings();
}

// -------------------------------------------------------------------- menu

export async function getMenu({ includeArchived = false } = {}) {
  return prisma.menuCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        where: includeArchived ? {} : { archived: false },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
}

export type MenuCategoryWithItems = Awaited<ReturnType<typeof getMenu>>[number];
export type MenuItemRow = MenuCategoryWithItems["items"][number];

// ------------------------------------------------------------------ orders

const orderInclude = {
  items: true,
  user: { select: { name: true, phone: true, email: true } },
} as const;

/** What the browser needs to open Razorpay Checkout for an order. */
export interface CheckoutParams {
  keyId: string;
  razorpayOrderId: string;
  amount: number; // paise
  currency: "INR";
  name: string;
  email: string;
  phone: string | null;
  timeoutSeconds: number;
}

function checkoutParams(user: CurrentUser, razorpayOrderId: string, total: number): CheckoutParams {
  return {
    keyId: razorpayKeyId(),
    razorpayOrderId,
    amount: toPaise(total),
    currency: "INR",
    name: user.name,
    email: user.email,
    phone: user.phone,
    // Close the Razorpay window a few minutes before the order expires.
    timeoutSeconds: (PAYMENT_WINDOW_MINUTES - 5) * 60,
  };
}

/**
 * Online orders not paid in time are cancelled, so they don't hold a place in
 * the queue. If a payment for one still arrives later it is refunded
 * automatically (see confirmOnlinePayment).
 */
export async function expireUnpaidOrders(now = new Date()) {
  await prisma.order.updateMany({
    where: { status: "AWAITING_PAYMENT", createdAt: { lt: new Date(now.getTime() - PAYMENT_WINDOW_MINUTES * 60 * 1000) } },
    data: { status: "CANCELLED", cancelledAt: now, cancelReason: "Payment not completed in time" },
  });
}

/** Hands out the next pickup token for today (IST), atomically. */
async function nextToken(tx: Pick<typeof prisma, "dailyCounter">) {
  const day = istDateKey(new Date());
  const counter = await tx.dailyCounter.upsert({
    where: { day },
    create: { day, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

export async function placeOrder(
  user: CurrentUser,
  input: {
    items: { menuItemId: string; quantity: number }[];
    paymentMethod: PaymentMethod;
    note: string | null;
    fulfilment: Fulfilment;
    hostel: string | null;
    room: string | null;
  },
) {
  const delivery = input.fulfilment === "DELIVERY";
  const online = input.paymentMethod === "ONLINE";
  const options = paymentOptions();
  if (online && !options.online) throw new HttpError(400, "Online payment isn't available. Please choose pay at counter.");
  if (!online && !options.counter) throw new HttpError(400, "Pay at counter isn't available. Please pay online.");

  const settings = await getCanteenSettings();
  if (!settings.open) throw new HttpError(409, "The canteen is closed right now");

  // Merge duplicate lines for the same dish.
  const quantities = new Map<string, number>();
  for (const line of input.items) {
    quantities.set(line.menuItemId, (quantities.get(line.menuItemId) ?? 0) + line.quantity);
  }

  // Names, prices and availability always come from the database, never from
  // the browser.
  const dishes = await prisma.menuItem.findMany({ where: { id: { in: [...quantities.keys()] } } });
  const lines = [...quantities.entries()].map(([menuItemId, quantity]) => {
    const dish = dishes.find((d) => d.id === menuItemId);
    if (!dish || dish.archived) throw new HttpError(400, "An item in your cart is no longer on the menu");
    if (!dish.isAvailable) throw new HttpError(409, `${dish.name} is not available right now`);
    if (quantity > MAX_ITEM_QUANTITY) throw new HttpError(400, `You can order at most ${MAX_ITEM_QUANTITY} of ${dish.name}`);
    return { menuItemId, quantity, name: dish.name, price: dish.price, isVeg: dish.isVeg };
  });
  const total = orderTotal(lines);
  if (total <= 0) throw new HttpError(400, "Your order total must be more than ₹0");

  await expireUnpaidOrders();
  const active = await prisma.order.count({
    where: { userId: user.id, status: { in: [...ACTIVE_STATUSES, "AWAITING_PAYMENT"] } },
  });
  if (active >= MAX_ACTIVE_ORDERS_PER_USER) {
    throw new HttpError(429, `You already have ${active} orders in progress. Please collect or cancel them first.`);
  }

  const order = await prisma.$transaction(async (tx) => {
    // Remember the delivery address so checkout is pre-filled next time.
    if (delivery && (input.hostel !== user.hostel || input.room !== user.room)) {
      await tx.user.update({ where: { id: user.id }, data: { hostel: input.hostel, room: input.room } });
    }
    return tx.order.create({
      data: {
        // Online orders get their token once paid, so tokens at the counter
        // have no gaps from abandoned payments.
        token: online ? 0 : await nextToken(tx),
        status: online ? "AWAITING_PAYMENT" : "PLACED",
        userId: user.id,
        total,
        paymentMethod: input.paymentMethod,
        note: input.note,
        fulfilment: input.fulfilment,
        deliveryHostel: delivery ? input.hostel : null,
        deliveryRoom: delivery ? input.room : null,
        items: { create: lines },
      },
      include: orderInclude,
    });
  });

  if (!online) return { order, checkout: null };

  try {
    const rzp = await createRazorpayOrder({
      amountRupees: total,
      receipt: order.id,
      notes: { orderId: order.id, userId: user.id },
    });
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzp.id },
      include: orderInclude,
    });
    return { order: updated, checkout: checkoutParams(user, rzp.id, total) };
  } catch (err) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Online payment could not be started" },
    });
    throw err;
  }
}

/** Re-open Razorpay Checkout for one of the user's unpaid online orders. */
export async function startPayment(user: CurrentUser, id: string) {
  await expireUnpaidOrders();
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) throw new HttpError(404, "Order not found");
  if (order.status !== "AWAITING_PAYMENT" || order.isPaid) throw new HttpError(409, "This order doesn't need a payment");
  const settings = await getCanteenSettings();
  if (!settings.open) throw new HttpError(409, "The canteen is closed right now");
  let razorpayOrderId = order.razorpayOrderId;
  if (!razorpayOrderId) {
    const rzp = await createRazorpayOrder({ amountRupees: order.total, receipt: order.id, notes: { orderId: order.id, userId: user.id } });
    razorpayOrderId = rzp.id;
    await prisma.order.update({ where: { id }, data: { razorpayOrderId } });
  }
  return checkoutParams(user, razorpayOrderId, order.total);
}

/**
 * Marks an online order paid. Called from the browser after Checkout (with a
 * verified signature) and from the Razorpay webhook; both may arrive, in any
 * order, so this is idempotent. The payment is always re-read from Razorpay:
 * it must belong to this order, be in rupees, be for exactly the order total
 * and be captured.
 */
export async function confirmOnlinePayment(razorpayOrderId: string, paymentId: string) {
  const order = await prisma.order.findUnique({ where: { razorpayOrderId } });
  if (!order) return null;
  if (order.isPaid && order.razorpayPaymentId === paymentId) return order;

  let payment: RazorpayPayment = await fetchPayment(paymentId);
  if (payment.order_id !== razorpayOrderId || payment.currency !== "INR" || payment.amount !== toPaise(order.total)) {
    console.error("Payment does not match order", { orderId: order.id, paymentId, paymentOrder: payment.order_id, amount: payment.amount });
    throw new HttpError(400, "This payment doesn't match the order");
  }
  if (payment.status === "authorized") {
    try {
      payment = await capturePayment(paymentId, payment.amount);
    } catch {
      // Captured meanwhile by the other path (webhook or browser): re-check.
      payment = await fetchPayment(paymentId);
    }
  }
  if (payment.status !== "captured") {
    throw new HttpError(409, "The payment hasn't gone through yet. If money left your account, it will update in a minute.");
  }

  const paidAt = new Date();
  const confirmed = await prisma.$transaction(async (tx) => {
    const res = await tx.order.updateMany({
      where: { id: order.id, status: "AWAITING_PAYMENT", isPaid: false },
      data: { status: "PLACED", isPaid: true, paidAt, razorpayPaymentId: paymentId },
    });
    if (res.count === 0) return false;
    await tx.order.update({ where: { id: order.id }, data: { token: await nextToken(tx) } });
    return true;
  });
  const current = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  if (confirmed || current.razorpayPaymentId === paymentId) return current;

  // Paid after the order was cancelled or expired, or paid twice: give the
  // money back.
  console.warn("Refunding a payment for an order that can't take it", { orderId: order.id, paymentId, status: current.status });
  let refund: { id: string; status: string } | null = null;
  try {
    refund = await refundPayment(paymentId, { orderId: order.id, reason: "Order was cancelled before payment completed" });
  } catch (err) {
    console.error("Automatic refund failed; refund it from the Razorpay dashboard", { orderId: order.id, paymentId }, err);
  }
  if (!current.razorpayPaymentId) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayPaymentId: paymentId,
        paidAt,
        refundId: refund?.id ?? null,
        refundStatus: refund ? refundStatusFrom(refund.status) : "FAILED",
      },
    });
  }
  throw new HttpError(409, refund
    ? "This order was already cancelled, so your payment is being refunded to you."
    : "This order was already cancelled. Please show this payment at the counter for a refund.");
}

function refundStatusFrom(status: string) {
  return status === "processed" ? "PROCESSED" : status === "failed" ? "FAILED" : "PENDING";
}

/** Gives the money back for a cancelled order that was paid online. */
async function refundIfPaidOnline(id: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.paymentMethod !== "ONLINE" || !order.isPaid || !order.razorpayPaymentId || order.refundId) return;
  try {
    const refund = await refundPayment(order.razorpayPaymentId, { orderId: order.id, reason: order.cancelReason ?? "Order cancelled" });
    await prisma.order.update({ where: { id }, data: { refundId: refund.id, refundStatus: refundStatusFrom(refund.status) } });
  } catch (err) {
    console.error("Refund failed; refund it from the Razorpay dashboard", { orderId: id }, err);
    await prisma.order.update({ where: { id }, data: { refundStatus: "FAILED" } });
  }
}

/** Razorpay tells us a refund finished (refund.processed / refund.failed). */
export async function updateRefundStatus(refundId: string, status: string) {
  await prisma.order.updateMany({ where: { refundId }, data: { refundStatus: refundStatusFrom(status) } });
}

export async function listMyOrders(userId: string) {
  await expireUnpaidOrders();
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: true },
  });
}

/** An order the given user is allowed to see: their own, or any for canteen staff. */
export async function getOrderFor(user: CurrentUser, id: string) {
  await expireUnpaidOrders();
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  if (!order) return null;
  if (order.userId !== user.id && !hasRole(user.role, CANTEEN_ROLES)) return null;
  return order;
}

export async function cancelByCustomer(user: CurrentUser, id: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) throw new HttpError(404, "Order not found");
  if (!customerCanCancel(order.status as OrderStatus)) {
    throw new HttpError(409, "The canteen has already started on this order. Please speak to the counter.");
  }
  const updated = await prisma.order.updateMany({
    where: { id, status: { in: ["PLACED", "AWAITING_PAYMENT"] } },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "Cancelled by customer" },
  });
  if (updated.count === 0) throw new HttpError(409, "This order can no longer be cancelled");
  await refundIfPaidOnline(id);
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}

/** Live queue for the counter: active orders plus today's finished ones. */
export async function listStaffOrders(now = new Date()) {
  await expireUnpaidOrders(now);
  const [active, done] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      orderBy: { createdAt: "asc" },
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: {
        status: { in: ["COMPLETED", "CANCELLED"] },
        createdAt: { gte: startOfDayIST(now) },
        // Online orders that were never paid never reached the kitchen.
        NOT: { paymentMethod: "ONLINE", paidAt: null },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: orderInclude,
    }),
  ]);
  return { active, done };
}

export async function updateOrderByStaff(
  id: string,
  input: { status?: OrderStatus; isPaid?: boolean; cancelReason?: string | null },
) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw new HttpError(404, "Order not found");

  if (order.status === "AWAITING_PAYMENT") throw new HttpError(409, "This order hasn't been paid yet");
  const data: Record<string, unknown> = {};
  if (input.isPaid !== undefined && input.isPaid !== order.isPaid) {
    // Online payments are only ever marked by Razorpay's confirmation.
    if (order.paymentMethod === "ONLINE") throw new HttpError(400, "Online payments are confirmed by Razorpay and can't be changed here");
    data.isPaid = input.isPaid;
    data.paidAt = input.isPaid ? new Date() : null;
  }
  if (input.status && input.status !== order.status) {
    if (!canTransition(order.status as OrderStatus, input.status)) {
      throw new HttpError(409, `Can't move an order from ${order.status} to ${input.status}`);
    }
    data.status = input.status;
    const stamp = statusTimestampField(input.status);
    if (stamp) data[stamp] = new Date();
    if (input.status === "CANCELLED") data.cancelReason = input.cancelReason ?? "Cancelled by canteen";
  }

  // Guard on the status we read, so two staff tapping at once can't skip a step.
  const result = await prisma.order.updateMany({ where: { id, status: order.status }, data });
  if (result.count === 0) throw new HttpError(409, "This order was just updated by someone else. Refresh and try again.");
  if (data.status === "CANCELLED") await refundIfPaidOnline(id);
  return prisma.order.findUnique({ where: { id }, include: orderInclude });
}
