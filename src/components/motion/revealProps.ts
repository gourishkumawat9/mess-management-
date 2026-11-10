// Plain helper (usable from server and client components) for <RevealObserver>.
/** Props that make an element fade/slide in on scroll. `delay` in ms staggers siblings. */
export function reveal(kind: "up" | "zoom" | "left" | "right" | "drop" = "up", delay = 0, style?: Record<string, string | number>) {
  return {
    "data-reveal": kind,
    style: { "--reveal-delay": `${delay}ms`, ...style } as React.CSSProperties,
  };
}
