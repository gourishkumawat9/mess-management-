import type { Metadata } from "next";
import { UsersTable } from "@/components/staff/UsersTable";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Users & roles" };

export default async function UsersPage() {
  const admin = await requirePageUser(["ADMIN"], "/staff/users");
  const users = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, name: true, email: true, phone: true, role: true, active: true, createdAt: true },
  });
  return <UsersTable users={JSON.parse(JSON.stringify(users))} currentUserId={admin.id} />;
}
