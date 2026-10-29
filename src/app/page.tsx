import { MenuBrowser, type MenuSection } from "@/components/canteen/MenuBrowser";
import { getCurrentUser } from "@/lib/auth";
import { getCanteenSettings, getMenu } from "@/server/canteen";

export default async function CanteenPage() {
  const [menu, settings, user] = await Promise.all([getMenu(), getCanteenSettings(), getCurrentUser()]);

  const sections: MenuSection[] = menu
    .filter((c) => c.items.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: c.items.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: i.price,
        isVeg: i.isVeg,
        emoji: i.emoji,
        imageUrl: i.imageUrl,
        isAvailable: i.isAvailable,
        isBestseller: i.isBestseller,
      })),
    }));

  return <MenuBrowser sections={sections} settings={settings} firstName={user?.name.split(" ")[0] ?? null} />;
}
