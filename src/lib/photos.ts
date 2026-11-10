// Real photographs used for decoration across the app. All are from Unsplash
// under the Unsplash License (free to use, no permission needed); credits are
// kept here and in PHOTO_CREDITS.md. They are loaded from Unsplash's CDN at the
// size each slot needs. Swap any of these for the institute's own photos later.

export interface Photo {
  src: string;
  alt: string;
  credit: string;
  page: string;
}

const u = (id: string) => `https://images.unsplash.com/${id}`;

/** Unsplash image URL resized and cropped for a slot. */
export function photoUrl(photo: Photo, width: number, height?: number) {
  const params = new URLSearchParams({ auto: "format", fit: "crop", q: "75", w: String(width) });
  if (height) params.set("h", String(height));
  return `${photo.src}?${params}`;
}

export const PHOTOS = {
  thali: {
    src: u("photo-1589778655375-3e622a9fc91c"),
    alt: "A full meal of rice, curries and sides on a steel tray",
    credit: "Barun Ghosh",
    page: "https://unsplash.com/photos/assorted-foods-on-stainless-steel-tray-wClFKcjhNcI",
  },
  chai: {
    src: u("photo-1761483281417-778013dc0177"),
    alt: "Chai being poured into small clay cups",
    credit: "AJOY DAS",
    page: "https://unsplash.com/photos/person-pouring-tea-into-small-clay-cups-gXYwwTQ_tZw",
  },
  samosa: {
    src: u("photo-1601050690597-df0568f70950"),
    alt: "Golden samosas with green chilli on a wooden tray",
    credit: "kabir cheema",
    page: "https://unsplash.com/photos/samosas-with-green-chili-and-pomegranate-8T9AVksyt7s",
  },
  vadaPav: {
    src: u("photo-1750767397012-3413ba4fdbc7"),
    alt: "Vada pav, a Mumbai street-food favourite",
    credit: "Zoshua Colah",
    page: "https://unsplash.com/photos/vada-pav-a-popular-indian-street-food-nNIHe72pa60",
  },
  shake: {
    src: u("photo-1775708838877-a3b8d7383c31"),
    alt: "A milkshake topped with whipped cream",
    credit: "ikhsan baihaqi",
    page: "https://unsplash.com/photos/a-milkshake-topped-with-whipped-cream-and-candy-l74h63Dgv3I",
  },
  sandwich: {
    src: u("photo-1528735602780-2552fd46c7af"),
    alt: "Grilled corn sandwiches with three small dips",
    credit: "Pixzolo Photography",
    page: "https://unsplash.com/photos/grilled-corn-sandwich-breakfast-plate-BiWb1Y8wpZk",
  },
  grilledSandwich: {
    src: u("photo-1709689156424-16fe0e05b47b"),
    alt: "A grilled sandwich with a bowl of dipping sauce",
    credit: "Shuvro Mojumder",
    page: "https://unsplash.com/photos/a-grilled-sandwich-on-a-plate-with-a-bowl-of-dipping-sauce-nU8e2R6RaI0",
  },
  dosa: {
    src: u("photo-1668236543090-82eba5ee5976"),
    alt: "Crispy dosa with potato masala, sambar and chutneys",
    credit: "Paul",
    page: "https://unsplash.com/photos/dosa-with-masala-and-chutney-breakfast-5oF7d_hPJG4",
  },
  roti: {
    src: u("photo-1567337710282-00832b415979"),
    alt: "Fresh rotis on a steel plate",
    credit: "Lai YuChing",
    page: "https://unsplash.com/photos/roti-in-round-gray-stainless-steel-tray-WxePxgrIJbQ",
  },
  vegetables: {
    src: u("photo-1775677073681-194049b1a7d3"),
    alt: "Fresh vegetables at a market stall",
    credit: "Rudrendu Sharma",
    page: "https://unsplash.com/photos/a-vibrant-display-of-fresh-vegetables-at-a-market-6qWr1uDQz-o",
  },
  kitchen: {
    src: u("photo-1777253205822-2cc59aa3808d"),
    alt: "Cooks preparing food in a busy kitchen",
    credit: "Cheng Shi Song",
    page: "https://unsplash.com/photos/workers-preparing-food-in-a-busy-restaurant-kitchen-ndloYdUILfE",
  },
  pots: {
    src: u("photo-1588416820614-f8d6ac6cea56"),
    alt: "Large steel cooking pots on a stove",
    credit: "Francisco Suarez",
    page: "https://unsplash.com/photos/stainless-steel-cooking-pots-on-stove-0EkWTSFXwCc",
  },
  diners: {
    src: u("photo-1789314957624-5d2b4d44ee67"),
    alt: "People eating together in a sunlit canteen",
    credit: "Barney Goodman",
    page: "https://unsplash.com/photos/diners-in-sunlit-industrial-canteen-E5X8AgPfkHk",
  },
} satisfies Record<string, Photo>;
