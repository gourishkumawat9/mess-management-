import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { rateLimit } from "@/lib/rateLimit";
import { placeOrderSchema } from "@/lib/validation";
import { listMyOrders, placeOrder } from "@/server/canteen";

export const GET = route(async () => {
  const user = await requireUser();
  return json({ orders: await listMyOrders(user.id) });
});

export const POST = route(async (req) => {
  const user = await requireUser();
  if (!rateLimit(`order:${user.id}`, 10, 10 * 60 * 1000)) {
    throw new HttpError(429, "You're ordering too fast. Please wait a moment.");
  }
  const input = await readJson(req, placeOrderSchema);
  const order = await placeOrder(user, input);
  return json({ order }, { status: 201 });
});
