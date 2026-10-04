import { Check, GraduationCap, Highlighter, MessagesSquare, Presentation, Route, Sparkles, Timer, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ReadinessRing } from "./app-preview";
import { ArrowLink, CARD, CONTAINER, LIFT, SectionHeading } from "./primitives";

type Feature = { title: string; body: string; Icon: LucideIcon; preview: ReactNode; wide?: boolean };

const FEATURES: Feature[] = [
  {
    title: "Client Simulator",
    body: "Rehearse pushback, scope creep and bad news with client personas who react to what you actually say.",
    Icon: MessagesSquare,
    preview: <SimulatorPreview />,
    wide: true,
  },
  {
    title: "Storyboard Studio",
    body: "Build pyramid storylines and action titles, with coaching before the deck is due.",
    Icon: Presentation,
    preview: <PyramidPreview />,
  },
  {
    title: "SteerCo Rehearsal",
    body: "Present to a simulated steering committee and field the hard questions in the room.",
    Icon: Timer,
    preview: <SteerCoPreview />,
  },
  {
    title: "Partner Red Pen",
    body: "Submit a draft and get partner-grade margin notes on structure, logic and the so-what.",
    Icon: Highlighter,
    preview: <RedPenPreview />,
    wide: true,
  },
  {
    title: "Learn tracks",
    body: "Short lessons on the frameworks and habits each level is assessed on.",
    Icon: GraduationCap,
    preview: <LearnPreview />,
    wide: true,
  },
  {
    title: "Progress & readiness",
    body: "Readiness by competency, so you know exactly what stands between you and the next level.",
    Icon: Route,
    preview: <ProgressPreview />,
  },
];

export function Features({ ctaHref }: { ctaHref: string }) {
  return (
    <section aria-labelledby="features-title" id="features" className="scroll-mt-24 py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeading
          id="features-title"
          eyebrow="AI-powered coaching"
          eyebrowIcon={<Sparkles size={14} aria-hidden />}
          first="Everything you need to"
          second="earn the next promotion"
          lede="Six tools built around the moments that decide careers in consulting: the tough client call, the storyline, the SteerCo and the review."
        />

        <ul className="m-0 mt-14 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className={`${CARD} ${LIFT} flex flex-col gap-5 p-4 sm:p-5 ${f.wide ? "lg:col-span-2" : ""}`}>
              <div aria-hidden className="relative h-44 overflow-hidden rounded-xl bg-subtle ring-1 ring-border">
                {f.preview}
              </div>
              <div className="flex flex-1 flex-col gap-2 px-1 pb-1">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-tint text-primary">
                    <f.Icon size={18} />
                  </span>
                  <h3 className="m-0 font-display text-xl font-semibold tracking-tight text-ink">{f.title}</h3>
                </div>
                <p className="m-0 text-[15px] leading-relaxed text-muted">{f.body}</p>
                <ArrowLink href={ctaHref} className="mt-auto self-start pt-2">
                  Try it free<span className="sr-only">: {f.title}</span>
                </ArrowLink>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Mini UI previews (pure markup, decorative) ---------- */

function SimulatorPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5 p-4 sm:px-6">
      <div className="flex max-w-[85%] items-start gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[10px] font-semibold text-accent-ink">MO</span>
        <p className="m-0 rounded-md rounded-tl-sm bg-surface px-3 py-2 text-[12.5px] leading-snug text-ink shadow-sm ring-1 ring-border">
          I need the business case by Friday, not in a fortnight.
        </p>
      </div>
      <p className="m-0 max-w-[80%] self-end rounded-md rounded-tr-sm bg-primary px-3 py-2 text-[12.5px] leading-snug text-on-primary shadow-sm">
        Friday works for the cost view. Benefits need two more weeks of data.
      </p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Chip tone="success">
          <Check size={12} strokeWidth={3} /> Options offered
        </Chip>
        <Chip tone="primary">Mood: warming</Chip>
        <Chip tone="muted">Scope creep</Chip>
      </div>
    </div>
  );
}

function PyramidPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
      <div className="w-[62%] rounded-md bg-primary px-2 py-1.5 text-center text-[11px] font-semibold text-on-primary shadow-sm">
        Move payroll to wave 2
      </div>
      <div className="h-2 w-px bg-border-strong" />
      <div className="grid w-full grid-cols-3 gap-1.5">
        {["Risk", "Cost", "Readiness"].map((t) => (
          <div key={t} className="rounded-sm bg-surface px-1 py-1.5 text-center text-[10.5px] font-medium text-ink-2 shadow-sm ring-1 ring-border">
            {t}
          </div>
        ))}
      </div>
      <div className="grid w-full grid-cols-6 gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`h-4 rounded-[4px] ${i === 4 ? "bg-accent-tint ring-1 ring-accent" : "bg-border"}`} />
        ))}
      </div>
    </div>
  );
}

function SteerCoPreview() {
  return (
    <div className="flex h-full flex-col gap-2.5 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ink-2">Slide 3 of 5</span>
        <span className="tabular inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm ring-1 ring-border">
          <Timer size={11} /> 02:41
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 rounded-md bg-surface p-2.5 shadow-sm ring-1 ring-border">
        <div className="h-2 w-3/4 rounded-full bg-ink-2/70" />
        <div className="mt-1 flex flex-1 items-end gap-1.5">
          {[40, 62, 50, 78, 90].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-[3px] bg-primary/70" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>
      <div className="rounded-md bg-accent-tint px-2.5 py-1.5 text-[11px] leading-snug text-accent-ink">
        <span className="font-semibold">CFO:</span> What does a month&apos;s delay cost us?
      </div>
    </div>
  );
}

function RedPenPreview() {
  return (
    <div className="flex h-full gap-4 p-4 sm:px-6">
      <div className="flex flex-1 flex-col gap-2 rounded-md bg-surface p-3 text-[12px] leading-relaxed text-ink-2 shadow-sm ring-1 ring-border">
        <span className="font-semibold text-ink">Executive summary</span>
        <p className="m-0">
          <span className="text-muted line-through decoration-danger decoration-2">We have reviewed a number of options across the estate and</span>{" "}
          <span className="rounded-[3px] bg-danger-tint px-0.5 text-ink">Consolidating to one data platform saves £2.4m a year.</span>
        </p>
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full rounded-full bg-border" />
          <div className="h-1.5 w-4/5 rounded-full bg-border" />
        </div>
      </div>
      <div className="hidden w-40 shrink-0 flex-col gap-2 min-[420px]:flex">
        <div className="rounded-md border-l-[3px] border-danger bg-surface px-2.5 py-2 text-[11.5px] leading-snug text-ink shadow-sm">
          <span className="font-semibold text-danger">So what?</span> Lead with the answer, not the process.
        </div>
        <div className="rounded-md border-l-[3px] border-danger bg-surface px-2.5 py-2 text-[11.5px] leading-snug text-ink shadow-sm">
          <span className="font-semibold text-danger">Evidence</span> Source the £2.4m.
        </div>
      </div>
    </div>
  );
}

function LearnPreview() {
  const rows = [
    { t: "Hypothesis-led problem solving", done: 4, of: 6 },
    { t: "Managing senior stakeholders", done: 2, of: 5 },
    { t: "Writing action titles", done: 5, of: 5 },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-2 p-4 sm:px-6">
      {rows.map((r) => (
        <div key={r.t} className="flex items-center gap-3 rounded-md bg-surface px-3 py-2 shadow-sm ring-1 ring-border">
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-ink">{r.t}</span>
          <div className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-primary-tint min-[420px]:block">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(r.done / r.of) * 100}%` }} />
          </div>
          {r.done === r.of ? (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
              <Check size={12} strokeWidth={3} />
            </span>
          ) : (
            <span className="tabular text-[11px] font-semibold text-muted">
              {r.done}/{r.of}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ProgressPreview() {
  const steps = ["Analyst", "Consultant", "Manager", "Director"];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
      <div className="relative flex items-center justify-center">
        <ReadinessRing percent={72} size={72} stroke={7} />
        <span className="tabular absolute font-display text-lg font-semibold text-ink">72%</span>
      </div>
      <ol className="m-0 flex list-none flex-wrap items-center justify-center gap-1 p-0">
        {steps.map((s, i) => (
          <li key={s} className="flex items-center gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${
                i < 2 ? "bg-primary text-on-primary" : i === 2 ? "bg-primary-tint text-primary ring-1 ring-primary" : "bg-surface text-muted ring-1 ring-border"
              }`}
            >
              {s}
            </span>
            {i < steps.length - 1 && <span className="h-px w-1.5 bg-border-strong" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Chip({ tone, children }: { tone: "success" | "primary" | "muted"; children: ReactNode }) {
  const cls = {
    success: "bg-success-tint text-success",
    primary: "bg-primary-tint text-primary",
    muted: "bg-surface text-muted ring-1 ring-border",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}
