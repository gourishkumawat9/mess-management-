import clsx from "clsx";

// Placeholder "photo" until real dish photos are uploaded: an emoji on a warm
// gradient. If a menu item has an imageUrl, that is shown instead.
const GRADIENTS = [
  "from-amber-100 via-orange-100 to-rose-100",
  "from-rose-100 via-pink-100 to-orange-50",
  "from-lime-100 via-emerald-50 to-amber-50",
  "from-sky-100 via-indigo-50 to-rose-50",
  "from-yellow-100 via-amber-50 to-orange-100",
];

function pick(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function DishImage({
  name,
  emoji,
  imageUrl,
  className,
  size = "md",
}: {
  name: string;
  emoji: string | null;
  imageUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={name} className={clsx("object-cover", className)} loading="lazy" />;
  }
  return (
    <div className={clsx("flex items-center justify-center bg-gradient-to-br", pick(name), className)} aria-hidden>
      <span className={clsx("drop-shadow-sm", size === "sm" ? "text-2xl" : size === "lg" ? "text-6xl" : "text-5xl")}>
        {emoji || "🍽️"}
      </span>
    </div>
  );
}
