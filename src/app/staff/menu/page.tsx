import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth";
import { CANTEEN_ROLES } from "@/lib/constants";
import { MenuManager } from "@/components/staff/MenuManager";
import { getMenu } from "@/server/canteen";

export const metadata: Metadata = { title: "Canteen menu" };

export default async function StaffMenuPage() {
  await requirePageUser(CANTEEN_ROLES, "/staff/menu");
  const categories = await getMenu();
  return <MenuManager categories={JSON.parse(JSON.stringify(categories))} />;
}
