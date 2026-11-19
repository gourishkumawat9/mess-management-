import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { HttpError } from "@/lib/api";

// Razorpay (UPI, cards, wallets) for online payment, plus pay at the counter.
//
// Keys come only from the server environment (never the browser):
//   RAZORPAY_KEY_ID          rzp_live_... (or rzp_test_... while testing)
//   RAZORPAY_KEY_SECRET      the secret shown with the key id
//   RAZORPAY_WEBHOOK_SECRET  the secret you type when adding the webhook
//   PAY_AT_COUNTER           "false" to stop offering cash/UPI at the counter
//
// An order is only marked paid after the server has fetched the payment from
// Razorpay and checked that it belongs to that order, is for the exact amount
// and has been captured. Nothing the browser sends can mark an order paid.

// Overridable only so automated tests can point at a fake Razorpay.
const API = process.env.RAZORPAY_API_URL || "https://api.razorpay.com/v1";

export function razorpayConfigured() {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/** Which ways to pay checkout offers right now. */
export function paymentOptions() {
  const online = razorpayConfigured();
  const counter = process.env.PAY_AT_COUNTER !== "false";
  return { online, counter };
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new HttpError(503, "Online payment isn't set up yet. Please choose pay at counter.");
  return `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`;
}

async function razorpay<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: init?.method ?? "GET",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    if (err instanceof HttpError) throw err;
    console.error("Razorpay request failed", path, err);
    throw new HttpError(502, "Couldn't reach the payment service. Please try again.");
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: { description?: string; code?: string } };
  if (!res.ok) {
    console.error("Razorpay error", path, res.status, data?.error);
    throw new RazorpayError(res.status, data?.error?.description ?? `Razorpay returned ${res.status}`);
  }
  return data;
}

export class RazorpayError extends HttpError {
  constructor(status: number, message: string) {
    super(status >= 500 ? 502 : 400, message);
  }
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export interface RazorpayPayment {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string;
}

export interface RazorpayRefund {
  id: string;
  status: "pending" | "processed" | "failed";
}

/** Amount in paise for a total in whole rupees. */
export function toPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function createRazorpayOrder(input: { amountRupees: number; receipt: string; notes: Record<string, string> }) {
  return razorpay<RazorpayOrder>("/orders", {
    method: "POST",
    body: { amount: toPaise(input.amountRupees), currency: "INR", receipt: input.receipt.slice(0, 40), notes: input.notes },
  });
}

export function fetchPayment(paymentId: string) {
  return razorpay<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

export function capturePayment(paymentId: string, amountPaise: number) {
  return razorpay<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: "POST",
    body: { amount: amountPaise, currency: "INR" },
  });
}

/** Full refund of a payment. */
export function refundPayment(paymentId: string, notes: Record<string, string>) {
  return razorpay<RazorpayRefund>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    body: { notes },
  });
}

function hmacMatches(payload: string, secret: string, signature: string) {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The signature Razorpay Checkout hands the browser after a payment. */
export function checkoutSignatureValid(razorpayOrderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  return hmacMatches(`${razorpayOrderId}|${paymentId}`, secret, signature);
}

/** The X-Razorpay-Signature header on a webhook call, over the raw body. */
export function webhookSignatureValid(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return hmacMatches(rawBody, secret, signature);
}
