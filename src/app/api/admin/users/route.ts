import { prisma } from "@/lib/db";
import { viewerIsDemo } from "@/lib/auth";
import { redactContact } from "@/lib/demo";
import { json, requireUser, route } from "@/lib/api";

export const GET = route(async () => {
  await requireUser(["ADMIN"]);
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  });
  const shown = (await viewerIsDemo()) ? users.map(redactContact) : users;
  return json({ users: shown });
});
