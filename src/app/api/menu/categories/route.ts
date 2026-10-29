import { prisma } from "@/lib/db";
import { HttpError, STAFF_ROLES, json, readJson, requireUser, route } from "@/lib/api";
import { menuCategorySchema } from "@/lib/validation";

export const POST = route(async (req) => {
  await requireUser(STAFF_ROLES);
  const { name } = await readJson(req, menuCategorySchema);
  if (await prisma.menuCategory.findUnique({ where: { name } })) throw new HttpError(409, `"${name}" already exists`);
  const last = await prisma.menuCategory.aggregate({ _max: { sortOrder: true } });
  const category = await prisma.menuCategory.create({ data: { name, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  return json({ category }, { status: 201 });
});
