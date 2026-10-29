import { json, requireUser, route } from "@/lib/api";
import { cancelByCustomer } from "@/server/canteen";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  return json({ order: await cancelByCustomer(user, (await params).id) });
});
