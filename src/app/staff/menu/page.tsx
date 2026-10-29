import type { Metadata } from "next";
import { MenuManager } from "@/components/staff/MenuManager";
import { getMenu } from "@/server/canteen";

export const metadata: Metadata = { title: "Canteen menu" };

export default async function StaffMenuPage() {
  const categories = await getMenu();
  return <MenuManager categories={JSON.parse(JSON.stringify(categories))} />;
}
