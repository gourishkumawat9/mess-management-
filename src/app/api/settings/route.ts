import { STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { settingsSchema } from "@/lib/validation";
import { getCanteenSettings, updateCanteenSettings } from "@/server/canteen";

export const GET = route(async () => json(await getCanteenSettings()));

export const PATCH = route(async (req) => {
  await requireUser(STAFF_ROLES);
  const input = await readJson(req, settingsSchema);
  return json(await updateCanteenSettings(input));
});
