// Browser side of online payment: opens Razorpay Checkout for an order the
// server already created, then tells the server about the result. The server
// re-checks every payment with Razorpay, so nothing here can mark an order paid
// on its own.

import { api } from "./client";

export interface CheckoutParams {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: "INR";
  name: string;
  email: string;
  phone: string | null;
  timeoutSeconds: number;
}

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: (r: unknown) => void): void };
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    const el = existing ?? document.createElement("script");
    el.addEventListener("load", () => resolve());
    el.addEventListener("error", () => reject(new Error("Couldn't load the payment window. Check your internet and try again.")));
    if (!existing) {
      el.src = SCRIPT;
      el.async = true;
      document.body.appendChild(el);
    }
  });
}

/**
 * Opens Razorpay Checkout. Resolves "paid" once the server has confirmed the
 * payment, or "dismissed" if the window was closed without paying.
 */
export async function payOnline(orderId: string, params: CheckoutParams, label: string): Promise<"paid" | "dismissed"> {
  await loadScript();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error("Couldn't load the payment window. Please try again.");
  return new Promise((resolve, reject) => {
    const rzp = new Razorpay({
      key: params.keyId,
      order_id: params.razorpayOrderId,
      amount: params.amount,
      currency: params.currency,
      name: label,
      description: "Canteen order",
      prefill: { name: params.name, email: params.email, contact: params.phone ?? undefined },
      timeout: params.timeoutSeconds,
      theme: { color: "#b91c1c" },
      handler: async (res: RazorpaySuccess) => {
        try {
          await api(`/api/orders/${orderId}/pay/verify`, { body: res });
          resolve("paid");
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve("dismissed"), confirm_close: true },
    });
    rzp.on("payment.failed", () => {
      // Razorpay shows the failure and lets the student retry in the same
      // window; nothing to do here.
    });
    rzp.open();
  });
}
