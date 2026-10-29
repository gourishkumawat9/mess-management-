import { STAFF_ROLES, json, requireUser, route } from "@/lib/api";
import { listStaffOrders } from "@/server/canteen";

export const GET = route(async () => {
  await requireUser(STAFF_ROLES);
  return json(await listStaffOrders());
});
