import { HttpError, json, requireUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { startPayment } from "@/server/canteen";

type Ctx = { params: Promise<{ id: string }> };

// Opens (or re-opens) Razorpay Checkout for one of your unpaid online orders.
export const POST = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  if (!rateLimit(`pay:${user.id}`, 20, 10 * 60 * 1000)) throw new HttpError(429, "Too many attempts. Please wait a moment.");
  return json({ checkout: await startPayment(user, (await params).id) });
});
