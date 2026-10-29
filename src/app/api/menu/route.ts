import { json, route } from "@/lib/api";
import { getCanteenSettings, getMenu } from "@/server/canteen";

// Public: anyone can browse the menu; ordering needs a login.
export const GET = route(async () => {
  const [categories, settings] = await Promise.all([getMenu(), getCanteenSettings()]);
  return json({ categories, settings });
});
