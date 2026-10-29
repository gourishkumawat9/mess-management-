import type { Metadata } from "next";
import type { InventoryRowData } from "@/components/staff/InventoryView";
import { RestockList } from "@/components/staff/RestockList";
import { listInventory } from "@/server/inventory";

export const metadata: Metadata = { title: "Restock list" };

export default async function RestockPage() {
  const items = JSON.parse(JSON.stringify(await listInventory())) as InventoryRowData[];
  return <RestockList items={items} generatedAt={new Date().toISOString()} />;
}
