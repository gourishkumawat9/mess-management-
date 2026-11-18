import clsx from "clsx";

// An endless horizontal band of items (rendered twice so the loop is seamless).
// `repeat` lists the items several times per row so a short list still fills a
// wide screen; the loop slows by the same factor so the speed stays the same.
export function Marquee({
  items,
  className,
  reverse,
  repeat = 1,
  separator = "✦",
  separatorClassName = "text-gold-400",
}: {
  items: React.ReactNode[];
  className?: string;
  reverse?: boolean;
  repeat?: number;
  separator?: React.ReactNode;
  separatorClassName?: string;
}) {
  const list = Array.from({ length: repeat }, () => items).flat();
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {list.map((item, i) => (
        <span key={i} className="flex items-center">
          <span className="whitespace-nowrap px-6">{item}</span>
          <span className={separatorClassName} aria-hidden>
            {separator}
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className={clsx("relative flex overflow-hidden", className)}>
      <div
        className={clsx("marquee-track flex w-max", reverse ? "animate-marquee-rev" : "animate-marquee")}
        style={repeat > 1 ? { animationDuration: `${(reverse ? 45 : 40) * repeat}s` } : undefined}
      >
        {row()}
        {row(true)}
      </div>
    </div>
  );
}
