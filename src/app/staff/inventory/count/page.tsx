import type { Metadata } from "next";
import { StockCountForm } from "@/components/staff/StockCountForm";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Daily stock count" };

export default async function StockCountPage() {
  const items = await prisma.inventoryItem.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, category: true, unit: true, quantity: true },
  });
  return <StockCountForm items={items} />;
}
