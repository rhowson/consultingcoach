import type { ComponentProps } from "react";

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`rounded-lg border border-border bg-surface ${className}`} {...props} />;
}

/** Serif card/section title (20px). */
export function CardTitle({ className = "", ...props }: ComponentProps<"h2">) {
  return <h2 className={`m-0 font-serif text-xl font-semibold ${className}`} {...props} />;
}

export function Eyebrow({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`eyebrow ${className}`} {...props} />;
}
