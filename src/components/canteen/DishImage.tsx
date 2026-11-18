import clsx from "clsx";

// Placeholder "photo" until real dish photos are uploaded: an emoji on a warm
// gradient. If a menu item has an imageUrl, that is shown instead.
const GRADIENTS = [
  "from-gold-100 via-cream-200 to-brand-100",
  "from-brand-100 via-brand-50 to-gold-100",
  "from-cream-200 via-gold-100 to-cream-100",
  "from-brand-50 via-cream-100 to-brand-100",
  "from-gold-100 via-brand-50 to-cream-200",
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
