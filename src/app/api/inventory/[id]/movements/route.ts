import { STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { movementSchema } from "@/lib/validation";
import { recordMovement } from "@/server/inventory";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await requireUser(STAFF_ROLES);
  const input = await readJson(req, movementSchema);
  const movement = await recordMovement((await params).id, input, user.id);
  return json({ movement }, { status: 201 });
});
