import { HttpError, json, requireUser, route } from "@/lib/api";
import { getOrderFor } from "@/server/canteen";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const order = await getOrderFor(user, (await params).id);
  if (!order) throw new HttpError(404, "Order not found");
  return json({ order });
});
