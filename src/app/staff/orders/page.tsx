import type { Metadata } from "next";
import { OrderBoard } from "@/components/staff/OrderBoard";
import { getCanteenSettings, listStaffOrders } from "@/server/canteen";

export const metadata: Metadata = { title: "Live orders" };

export default async function StaffOrdersPage() {
  const [orders, settings] = await Promise.all([listStaffOrders(), getCanteenSettings()]);
  return <OrderBoard initial={JSON.parse(JSON.stringify(orders))} open={settings.open} />;
}
