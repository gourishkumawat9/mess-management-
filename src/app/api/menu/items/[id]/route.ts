import { prisma } from "@/lib/db";
import { HttpError, STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { updateMenuItemSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  await requireUser(STAFF_ROLES);
  const { id } = await params;
  const input = await readJson(req, updateMenuItemSchema);
  if (!(await prisma.menuItem.findUnique({ where: { id } }))) throw new HttpError(404, "Menu item not found");
  if (input.categoryId && !(await prisma.menuCategory.findUnique({ where: { id: input.categoryId } }))) {
    throw new HttpError(400, "Pick a menu category");
  }
  const item = await prisma.menuItem.update({ where: { id }, data: input });
  return json({ item });
});
