import { Check, GraduationCap, Highlighter, MessagesSquare, Presentation, Route, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ReadinessRing } from "./app-preview";
import { CARD, CONTAINER, LIFT, SectionHeading } from "./primitives";

type Feature = { title: string; body: string; Icon: LucideIcon; preview: ReactNode };

const FEATURES: Feature[] = [
  {
    title: "Practise client conversations",
    body: "Handle pushback on scope, timelines and bad news from AI clients who react to what you actually say. Every conversation is scored, with feedback.",
    Icon: MessagesSquare,
    preview: <SimulatorPreview />,
  },
  {
    title: "Build storylines",
    body: "Turn a case pack into a pyramid and a ghost deck, then get a coach review and a score before the real deck is due.",
    Icon: Presentation,
    preview: <StorylinePreview />,
  },
  {
    title: "Get a partner review",
    body: "Paste in a deliverable and get it back marked up the way a partner would: structure, logic and the so-what.",
    Icon: Highlighter,
    preview: <RedPenPreview />,
  },
  {
    title: "Track readiness",
    body: "See how ready you are for the next level, competency by competency, and what to practise next.",
    Icon: Route,
    preview: <ProgressPreview />,
  },
];

export function Features() {
  return (
    <section aria-labelledby="features-title" id="features" className="scroll-mt-24 py-24 sm:py-32">
      <div className={CONTAINER}>
        <SectionHeading
          id="features-title"
          eyebrow="What you can do"
          first="Four ways to get better"
          second="at the work that counts"
          lede="Each one covers a single part of the job. Start with whichever matters most this week."
        />

        <ul className="m-0 mt-16 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 lg:gap-8">
          {FEATURES.map((f) => (
            <li key={f.title} className={`${CARD} ${LIFT} flex flex-col gap-6 p-4 sm:p-5`}>
              <div aria-hidden className="relative h-44 overflow-hidden rounded-xl bg-subtle ring-1 ring-border">
                {f.preview}
              </div>
              <div className="flex flex-col gap-2 px-1 pb-2">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
                    <f.Icon size={18} />
                  </span>
                  <h3 className="m-0 font-display text-xl font-semibold tracking-tight text-ink">{f.title}</h3>
                </div>
                <p className="m-0 text-[15px] leading-relaxed text-muted">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mx-auto mt-12 mb-0 max-w-2xl text-center text-[15px] leading-relaxed text-pretty text-ink-2">
          <GraduationCap size={18} aria-hidden className="mr-2 inline-block align-[-3px] text-primary" />
          <span className="font-semibold text-ink">Plus short lessons in Learn,</span> including a client leadership &amp; business development track
          for client directors and anyone who sells services.
        </p>
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
        <Chip tone="primary">Score 4/5</Chip>
      </div>
    </div>
  );
}

function StorylinePreview() {
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
      {/* Ghost deck: one thumbnail per slide, with the one the coach flagged highlighted. */}
      <div className="grid w-full grid-cols-6 gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className={`h-4 rounded-[4px] ${i === 4 ? "bg-accent-tint ring-1 ring-accent" : "bg-border"}`} />
        ))}
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
          <span className="rounded-[3px] bg-danger-tint px-0.5 text-ink">One data platform cuts run costs by a third.</span>
        </p>
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full rounded-full bg-border" />
          <div className="h-1.5 w-4/5 rounded-full bg-border" />
        </div>
      </div>
      <div className="hidden w-36 shrink-0 flex-col gap-2 min-[420px]:flex">
        <div className="rounded-md border-l-[3px] border-danger bg-surface px-2.5 py-2 text-[11.5px] leading-snug text-ink shadow-sm">
          <span className="font-semibold text-danger">So what?</span> Lead with the answer, not the process.
        </div>
        <div className="rounded-md border-l-[3px] border-danger bg-surface px-2.5 py-2 text-[11.5px] leading-snug text-ink shadow-sm">
          <span className="font-semibold text-danger">Evidence</span> Source the saving.
        </div>
      </div>
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

function Chip({ tone, children }: { tone: "success" | "primary"; children: ReactNode }) {
  const cls = {
    success: "bg-success-tint text-success",
    primary: "bg-primary-tint text-primary",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}
