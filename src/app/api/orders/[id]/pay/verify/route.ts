import { z } from "zod";
import { prisma } from "@/lib/db";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { confirmOnlinePayment } from "@/server/canteen";
import { checkoutSignatureValid } from "@/server/payments";

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

// Called by the browser right after Razorpay Checkout succeeds, so the order
// moves on without waiting for the webhook. The signature proves the ids came
// from Razorpay, and confirmOnlinePayment still re-reads the payment from
// Razorpay before marking anything paid.
export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  if (!rateLimit(`verify:${user.id}`, 20, 10 * 60 * 1000)) throw new HttpError(429, "Too many attempts. Please wait a moment.");
  const { id } = await params;
  const body = await readJson(req, schema);
  const order = await prisma.order.findUnique({ where: { id }, select: { userId: true, razorpayOrderId: true } });
  if (!order || order.userId !== user.id) throw new HttpError(404, "Order not found");
  if (!order.razorpayOrderId || order.razorpayOrderId !== body.razorpay_order_id) {
    throw new HttpError(400, "This payment doesn't match the order");
  }
  if (!checkoutSignatureValid(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
    throw new HttpError(400, "Payment could not be verified");
  }
  await confirmOnlinePayment(body.razorpay_order_id, body.razorpay_payment_id);
  return json({ ok: true });
});
