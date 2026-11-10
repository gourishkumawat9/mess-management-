import clsx from "clsx";

// An endless horizontal band of items (rendered twice so the loop is seamless).
export function Marquee({ items, className }: { items: React.ReactNode[]; className?: string }) {
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6">{item}</span>
          <span className="text-gold-400" aria-hidden>
            ✦
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={clsx("relative flex overflow-hidden", className)}>
      <div className="marquee-track flex w-max animate-marquee">
        {row()}
        {row(true)}
      </div>
    </div>
  );
}
