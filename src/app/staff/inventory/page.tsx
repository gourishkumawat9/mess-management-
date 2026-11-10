import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth";
import { MESS_ROLES } from "@/lib/constants";
import { InventoryView, type InventoryRowData } from "@/components/staff/InventoryView";
import { listInventory } from "@/server/inventory";

export const metadata: Metadata = { title: "Mess inventory" };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requirePageUser(MESS_ROLES, "/staff/inventory");
  const [items, { filter }] = await Promise.all([listInventory(), searchParams]);
  const rows = JSON.parse(JSON.stringify(items)) as InventoryRowData[];
  return <InventoryView items={rows} initialFilter={filter} />;
}
