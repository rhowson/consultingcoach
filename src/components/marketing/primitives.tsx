import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

/** Page gutter: 16px on phones, wider from sm up. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

/** Hover lift for marketing cards (transitions are switched off under reduced motion in globals.css). */
export const LIFT = "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0";

/** White card used across the marketing sections. */
export const CARD = "rounded-2xl border border-border bg-surface shadow-md";

/** Small pill eyebrow above section headings. */
export function Eyebrow({ icon, children, tone = "default" }: { icon?: ReactNode; children: ReactNode; tone?: "default" | "sky" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${
        tone === "sky" ? "glass text-ink" : "border border-border bg-surface text-primary shadow-sm"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

/** Centred two-tone heading: first line ink, second line in the blue gradient. */
export function SectionHeading({
  id,
  eyebrow,
  eyebrowIcon,
  first,
  second,
  lede,
  align = "center",
  tone = "default",
}: {
  id?: string;
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  first: string;
  second: string;
  lede?: string;
  align?: "center" | "left";
  tone?: "default" | "sky";
}) {
  const centred = align === "center";
  return (
    <div className={`flex flex-col gap-4 ${centred ? "items-center text-center" : "items-start"}`}>
      {eyebrow && (
        <Eyebrow icon={eyebrowIcon} tone={tone}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        id={id}
        className={`m-0 max-w-3xl font-display text-[34px] leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-5xl ${
          tone === "sky" ? "text-white" : "text-ink"
        }`}
      >
        {first}
        <br />
        <span className={tone === "sky" ? "text-white/80" : "text-gradient"}>{second}</span>
      </h2>
      {lede && (
        <p className={`m-0 max-w-2xl text-[17px] leading-relaxed text-pretty ${tone === "sky" ? "text-white/90" : "text-ink-2"}`}>{lede}</p>
      )}
    </div>
  );
}

/** "Learn more →" style text link. */
export function ArrowLink({ className = "", children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={`group inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-hover ${className}`}
    >
      {children}
      <ArrowRight size={15} aria-hidden className="transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Checklist row with a blue tick chip. */
export function CheckItem({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3.5">
      <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
        <Check size={14} strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="text-[16px] font-semibold text-ink">{title}</span>
        {children && <span className="text-[15px] leading-relaxed text-muted">{children}</span>}
      </div>
    </li>
  );
}

/** White pill CTA for use over the sky gradient (surface + ink keeps it legible in dark mode too). */
export const SKY_PRIMARY =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-surface px-6 text-[15px] font-semibold whitespace-nowrap text-ink shadow-md ring-1 ring-white/40 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98] motion-reduce:hover:translate-y-0";
