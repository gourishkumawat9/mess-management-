import { NextResponse } from "next/server";
import { HttpError } from "@/lib/api";
import { confirmOnlinePayment, updateRefundStatus } from "@/server/canteen";
import { webhookSignatureValid } from "@/server/payments";

// Razorpay → this server. Set it up in the Razorpay Dashboard under
// Accounts & Settings → Webhooks:
//   URL:     https://<your site>/api/payments/razorpay/webhook
//   Secret:  the same value as RAZORPAY_WEBHOOK_SECRET
//   Events:  payment.authorized, payment.captured, order.paid,
//            refund.processed, refund.failed
// This is the source of truth for payments: it still works when the student
// closes the browser straight after paying.

interface WebhookBody {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string | null } };
    refund?: { entity?: { id?: string; status?: string } };
  };
}

export async function POST(req: Request) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !webhookSignatureValid(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (body.event) {
      case "payment.authorized":
      case "payment.captured":
      case "order.paid": {
        const payment = body.payload?.payment?.entity;
        if (payment?.id && payment.order_id) await confirmOnlinePayment(payment.order_id, payment.id);
        break;
      }
      case "refund.processed":
      case "refund.failed": {
        const refund = body.payload?.refund?.entity;
        if (refund?.id) await updateRefundStatus(refund.id, body.event === "refund.processed" ? "processed" : "failed");
        break;
      }
    }
  } catch (err) {
    // A 4xx from our own checks (e.g. a payment for a cancelled order, which is
    // refunded) is final; anything else asks Razorpay to retry later.
    if (err instanceof HttpError && err.status < 500) return NextResponse.json({ ok: true, note: err.message });
    console.error("Razorpay webhook failed", body.event, err);
    return NextResponse.json({ error: "Temporary failure" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
