import { CANTEEN_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { staffOrderUpdateSchema } from "@/lib/validation";
import { updateOrderByStaff } from "@/server/canteen";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireUser(CANTEEN_ROLES);
  const input = await readJson(req, staffOrderUpdateSchema);
  return json({ order: await updateOrderByStaff((await params).id, input) });
});
