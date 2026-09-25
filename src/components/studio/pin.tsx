/** Brass numbered pin marking a coach comment on a node or slide. */
export function Pin({ n, className = "", small = false }: { n: number; className?: string; small?: boolean }) {
  return (
    <span
      aria-label={`Coach comment ${n}`}
      className={`flex items-center justify-center rounded-full bg-accent font-semibold text-ink dark:text-bg ${
        small ? "h-[22px] w-[22px] text-[11px]" : "h-6 w-6 text-xs"
      } ${className}`}
    >
      {n}
    </span>
  );
}
