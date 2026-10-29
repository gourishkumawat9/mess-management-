import { STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { deliverySchema } from "@/lib/validation";
import { recordDelivery } from "@/server/inventory";

export const POST = route(async (req) => {
  const user = await requireUser(STAFF_ROLES);
  const { entries, note } = await readJson(req, deliverySchema);
  return json(await recordDelivery(entries, user.id, note), { status: 201 });
});
