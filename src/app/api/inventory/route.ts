import { STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { createInventoryItemSchema } from "@/lib/validation";
import { createInventoryItem, listInventory } from "@/server/inventory";

export const GET = route(async () => {
  await requireUser(STAFF_ROLES);
  return json({ items: await listInventory() });
});

export const POST = route(async (req) => {
  const user = await requireUser(STAFF_ROLES);
  const input = await readJson(req, createInventoryItemSchema);
  return json({ item: await createInventoryItem(input, user.id) }, { status: 201 });
});
