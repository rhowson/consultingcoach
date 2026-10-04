import Link from "next/link";
import { ArrowRight, Building2, Target, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { AppPreview, ReadinessRing } from "./app-preview";
import { CONTAINER, SKY_PRIMARY } from "./primitives";

export function Hero({ primaryHref, primaryLabel }: { primaryHref: string; primaryLabel: string }) {
  return (
    <section aria-labelledby="hero-title" className="sky relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Top scrim keeps white type legible on the brighter part of the sky. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-linear-to-b from-[rgba(10,40,80,0.22)] to-transparent" />
      {/* Extra soft cloud blobs for depth. */}
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-32 h-80 w-[520px] rounded-full bg-white/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-40 -right-40 h-72 w-[560px] rounded-full bg-white/20 blur-3xl" />

      <div className={`${CONTAINER} relative z-10 flex flex-col items-center text-center`}>
        <a
          href="#features"
          className="group inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-medium text-white ring-1 ring-white/35 backdrop-blur-md transition-colors hover:bg-white/25"
        >
          For technology &amp; transformation consultants
          <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
        </a>

        <h1
          id="hero-title"
          className="mt-6 mb-0 max-w-4xl font-display text-[42px] leading-[1.02] font-semibold tracking-[-0.045em] text-balance text-white [text-shadow:0_2px_24px_rgba(10,40,80,0.25)] sm:text-6xl lg:text-7xl"
        >
          Become the consultant clients ask for by name
        </h1>

        <p className="mt-6 mb-0 max-w-2xl text-[17px] leading-relaxed text-pretty text-white/95 [text-shadow:0_1px_12px_rgba(10,40,80,0.3)] sm:text-lg">
          Practise difficult client conversations, sharpen your storylines and rehearse SteerCo delivery with an AI coach that scores every rep
          against the level you&apos;re aiming for, from Analyst to Director.
        </p>

        <div className="mt-9 flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
          <Link href={primaryHref} className={`group ${SKY_PRIMARY}`}>
            {primaryLabel}
            <ArrowRight size={17} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="text-[15px] font-semibold text-white underline decoration-white/60 decoration-2 underline-offset-[6px] transition-colors hover:decoration-white"
          >
            See how it works
          </a>
        </div>

        {/* App preview with frosted callouts. */}
        <div className="relative mt-16 w-full max-w-[700px] sm:mt-20">
          <AppPreview />

          <ul className="m-0 mt-5 grid list-none grid-cols-1 gap-3 p-0 min-[400px]:grid-cols-2 xl:contents">
            <Callout className="xl:absolute xl:top-10 xl:-left-64" icon={<IconChip><Zap size={16} /></IconChip>} title="Live feedback on every turn" sub="See what landed, and why" />
            <Callout
              className="xl:absolute xl:top-24 xl:-right-64"
              icon={<IconChip><Target size={16} /></IconChip>}
              title="Scored against your target level"
              sub="Analyst to Director rubrics"
            />
            <Callout
              className="xl:absolute xl:bottom-24 xl:-left-64"
              icon={<IconChip><Building2 size={16} /></IconChip>}
              title="UK tech & transformation cases"
              sub="ERP, data, operating model"
            />
            <Callout
              className="xl:absolute xl:bottom-6 xl:-right-64"
              icon={
                <span className="relative flex items-center justify-center">
                  <ReadinessRing percent={72} size={40} stroke={4.5} />
                  <span className="tabular absolute text-[11px] font-semibold text-ink">72%</span>
                </span>
              }
              title="Readiness for promotion"
              sub="Consultant to Manager"
            />
          </ul>
        </div>
      </div>

      <CloudEdge />
    </section>
  );
}

function IconChip({ children }: { children: ReactNode }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary shadow-sm">{children}</span>;
}

function Callout({ icon, title, sub, className = "" }: { icon: ReactNode; title: string; sub: string; className?: string }) {
  return (
    <li
      className={`glass z-20 flex items-center gap-3 rounded-lg p-3 text-left shadow-md transition-transform duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0 xl:w-56 ${className}`}
    >
      <span aria-hidden className="flex">
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[13.5px] leading-tight font-semibold text-ink">{title}</span>
        <span className="mt-0.5 text-[12px] text-muted">{sub}</span>
      </span>
    </li>
  );
}

/** Soft cloud bank that dissolves the sky into the page background. */
const PUFFS: [number, number][] = [
  [0, 70], [95, 52], [180, 78], [280, 58], [370, 88], [480, 62], [570, 84], [670, 54], [760, 92],
  [870, 66], [965, 84], [1065, 58], [1160, 90], [1265, 62], [1355, 80], [1440, 66],
];

function CloudEdge() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-0">
      <div className="h-24 bg-linear-to-b from-transparent to-bg/50" />
      <svg viewBox="0 0 1440 140" preserveAspectRatio="none" className="-mt-px block h-20 w-full sm:h-28">
        <g className="fill-bg opacity-50">
          {PUFFS.map(([cx, r]) => (
            <circle key={`b${cx}`} cx={cx + 40} cy={120} r={r} />
          ))}
        </g>
        <g className="fill-bg">
          {PUFFS.map(([cx, r]) => (
            <circle key={`f${cx}`} cx={cx} cy={150} r={r * 0.9} />
          ))}
          <rect x="0" y="130" width="1440" height="10" />
        </g>
      </svg>
    </div>
  );
}
