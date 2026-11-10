import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth";
import { CANTEEN_ROLES } from "@/lib/constants";
import { OrderBoard } from "@/components/staff/OrderBoard";
import { getCanteenSettings, listStaffOrders } from "@/server/canteen";

export const metadata: Metadata = { title: "Live orders" };

export default async function StaffOrdersPage() {
  await requirePageUser(CANTEEN_ROLES, "/staff/orders");
  const [orders, settings] = await Promise.all([listStaffOrders(), getCanteenSettings()]);
  return <OrderBoard initial={JSON.parse(JSON.stringify(orders))} open={settings.open} />;
}
