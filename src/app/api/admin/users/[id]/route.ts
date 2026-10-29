import { prisma } from "@/lib/db";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { updateUserSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireUser(["ADMIN"]);
  const { id } = await params;
  const input = await readJson(req, updateUserSchema);
  // Stop an admin from locking themselves (and possibly everyone) out.
  if (id === admin.id && ((input.role !== undefined && input.role !== "ADMIN") || input.active === false)) {
    throw new HttpError(400, "You can't remove your own admin access");
  }
  if (!(await prisma.user.findUnique({ where: { id } }))) throw new HttpError(404, "User not found");
  const user = await prisma.user.update({
    where: { id },
    data: input,
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  });
  return json({ user });
});
