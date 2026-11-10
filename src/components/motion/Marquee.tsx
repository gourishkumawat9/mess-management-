import clsx from "clsx";

// An endless horizontal band of items (rendered twice so the loop is seamless).
export function Marquee({
  items,
  className,
  reverse,
  separator = "✦",
  separatorClassName = "text-gold-400",
}: {
  items: React.ReactNode[];
  className?: string;
  reverse?: boolean;
  separator?: React.ReactNode;
  separatorClassName?: string;
}) {
  const row = (hidden?: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
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
      <div className={clsx("marquee-track flex w-max", reverse ? "animate-marquee-rev" : "animate-marquee")}>
        {row()}
        {row(true)}
      </div>
    </div>
  );
}
