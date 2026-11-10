import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth";
import { MESS_ROLES } from "@/lib/constants";
import { StockCountForm } from "@/components/staff/StockCountForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Daily stock count" };

export default async function StockCountPage() {
  await requirePageUser(MESS_ROLES, "/staff/inventory/count");
  const items = await prisma.inventoryItem.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true, unit: true, quantity: true },
  });
  return <StockCountForm items={items} />;
}
