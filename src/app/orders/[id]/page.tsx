import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTracker, type TrackedOrder } from "@/components/canteen/OrderTracker";
import { requirePageUser } from "@/lib/auth";
import { getOrderFor } from "@/server/canteen";

export const metadata: Metadata = { title: "Track order" };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const user = await requirePageUser(undefined, `/orders/${id}`);
  const order = await getOrderFor(user, id);
  if (!order) notFound();
  const justPlaced = (await searchParams).placed === "1";
  return <OrderTracker initial={JSON.parse(JSON.stringify(order)) as TrackedOrder} justPlaced={justPlaced} />;
}
