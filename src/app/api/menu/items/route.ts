import { prisma } from "@/lib/db";
import { HttpError, STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { menuItemSchema } from "@/lib/validation";

export const POST = route(async (req) => {
  await requireUser(STAFF_ROLES);
  const input = await readJson(req, menuItemSchema);
  const category = await prisma.menuCategory.findUnique({ where: { id: input.categoryId } });
  if (!category) throw new HttpError(400, "Pick a menu category");
  const last = await prisma.menuItem.aggregate({ where: { categoryId: category.id }, _max: { sortOrder: true } });
  const item = await prisma.menuItem.create({ data: { ...input, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  return json({ item }, { status: 201 });
});
