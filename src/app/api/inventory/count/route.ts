import { STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { stockCountSchema } from "@/lib/validation";
import { recordStockCount } from "@/server/inventory";

export const POST = route(async (req) => {
  const user = await requireUser(STAFF_ROLES);
  const { entries, note } = await readJson(req, stockCountSchema);
  return json(await recordStockCount(entries, user.id, note));
});
