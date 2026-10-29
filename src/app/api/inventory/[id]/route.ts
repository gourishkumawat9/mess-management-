import { HttpError, STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { updateInventoryItemSchema } from "@/lib/validation";
import { getInventoryItem, updateInventoryItem } from "@/server/inventory";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  await requireUser(STAFF_ROLES);
  const item = await getInventoryItem((await params).id);
  if (!item) throw new HttpError(404, "Inventory item not found");
  return json({ item });
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireUser(STAFF_ROLES);
  const { id } = await params;
  const input = await readJson(req, updateInventoryItemSchema);
  if (!(await getInventoryItem(id))) throw new HttpError(404, "Inventory item not found");
  return json({ item: await updateInventoryItem(id, input) });
});
