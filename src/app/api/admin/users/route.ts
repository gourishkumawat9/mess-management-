import { prisma } from "@/lib/db";
import { json, requireUser, route } from "@/lib/api";

export const GET = route(async () => {
  await requireUser(["ADMIN"]);
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  });
  return json({ users });
});
