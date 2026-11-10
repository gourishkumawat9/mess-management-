import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth";
import { MESS_ROLES } from "@/lib/constants";
import type { InventoryRowData } from "@/components/staff/InventoryView";
import { RestockList } from "@/components/staff/RestockList";
import { listInventory } from "@/server/inventory";

export const metadata: Metadata = { title: "Restock list" };

export default async function RestockPage() {
  await requirePageUser(MESS_ROLES, "/staff/inventory/restock");
  const items = JSON.parse(JSON.stringify(await listInventory())) as InventoryRowData[];
  return <RestockList items={items} generatedAt={new Date().toISOString()} />;
}
