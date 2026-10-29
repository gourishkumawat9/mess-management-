import type { Metadata } from "next";
import { CheckoutView } from "@/components/canteen/CheckoutView";
import { requirePageUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCanteenSettings } from "@/server/canteen";

export const metadata: Metadata = { title: "Your cart" };

export default async function CheckoutPage() {
  const user = await requirePageUser(undefined, "/checkout");
  const [dishes, settings] = await Promise.all([
    prisma.menuItem.findMany({
      select: { id: true, name: true, price: true, isAvailable: true, archived: true },
    }),
    getCanteenSettings(),
  ]);
  // Current prices and availability, so a cart saved earlier can be checked.
  const menu = Object.fromEntries(
    dishes.map((d) => [d.id, { name: d.name, price: d.price, available: d.isAvailable && !d.archived }]),
  );
  return <CheckoutView menu={menu} open={settings.open} hours={settings.hours} userName={user.name} />;
}
