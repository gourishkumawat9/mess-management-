import clsx from "clsx";

/** The Indian FSSAI veg / non-veg mark: a square with a dot (or triangle). */
export function VegMark({ isVeg, className }: { isVeg: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      title={isVeg ? "Veg" : "Non-veg"}
      className={clsx(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] bg-white",
        isVeg ? "border-veg" : "border-nonveg",
        className,
      )}
    >
      {isVeg ? (
        <span className="h-2 w-2 rounded-full bg-veg" />
      ) : (
        <span className="h-0 w-0 border-x-[4px] border-b-[7px] border-x-transparent border-b-nonveg" />
      )}
    </span>
  );
}
