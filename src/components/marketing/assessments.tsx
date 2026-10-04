import { ArrowRight, ScanSearch, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { CARD, CheckItem, CONTAINER, LIFT, SectionHeading } from "./primitives";

const DIMENSIONS = [
  { label: "Critical thinking", score: 4.2 },
  { label: "Communication", score: 3.8 },
  { label: "AI fluency", score: 3.6 },
  { label: "Accuracy & rigour", score: 3.5 },
];

export function Assessments() {
  return (
    <section aria-labelledby="assessments-title" id="assessments" className="scroll-mt-24 border-y border-border bg-surface py-20 sm:py-28">
      <div className={`${CONTAINER} grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16`}>
        <div className="flex flex-col gap-8">
          <SectionHeading
            id="assessments-title"
            align="left"
            eyebrow="Interview assessments for firms"
            first="Hire for judgement,"
            second="not just polish"
            lede="Run a timed, realistic case with an AI assistant at the candidate's side, and get an evidence-backed report your assessors can discuss."
          />
          <ul className="m-0 flex list-none flex-col gap-5 p-0">
            <CheckItem title="60-minute timed case">A realistic brief, data pack and client conversation.</CheckItem>
            <CheckItem title="Scored with evidence">Critical thinking, communication and AI fluency, each backed by quotes from the session.</CheckItem>
            <CheckItem title="Guardrailed AI assistant">It helps candidates think and work faster, but it can&apos;t write the answer.</CheckItem>
            <CheckItem title="Planted-error detection">See who checks the numbers before they present them.</CheckItem>
            <CheckItem title="Integrity signals for discussion">Flags for assessors to explore, never automatic verdicts.</CheckItem>
          </ul>
          <ButtonLink href="/signup" size="lg" className="group self-start">
            Talk to us about assessments
            <ArrowRight size={17} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </ButtonLink>
        </div>

        <figure className={`${CARD} ${LIFT} m-0 overflow-hidden`}>
          <figcaption className="sr-only">
            Example candidate report: overall 3.8 out of 5, recommendation yes, planted error caught, with scores for critical thinking, communication,
            AI fluency and accuracy.
          </figcaption>
          <div aria-hidden>
            <div className="flex items-center justify-between gap-3 border-b border-border bg-subtle px-5 py-3.5 sm:px-7">
              <span className="text-[13px] font-semibold text-ink">Candidate report</span>
              <span className="truncate text-[12px] text-muted">Senior Consultant · Data platform case</span>
            </div>
            <div className="flex flex-col gap-6 p-5 sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="eyebrow">Overall</span>
                  <span className="tabular font-display text-5xl leading-none font-semibold tracking-tight text-ink">
                    3.8<span className="text-2xl text-muted">/5</span>
                  </span>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <span className="eyebrow">Recommendation</span>
                  <span className="inline-flex items-center rounded-full bg-success-tint px-3.5 py-1 text-[15px] font-semibold text-success">Yes</span>
                </div>
              </div>

              <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
                {DIMENSIONS.map((d) => (
                  <li key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[150px_minmax(0,1fr)_auto]">
                    <span className="text-[13.5px] font-medium text-ink-2">{d.label}</span>
                    <div className="col-span-2 row-start-2 h-2 rounded-full bg-hover sm:col-span-1 sm:row-start-auto">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(d.score / 5) * 100}%` }} />
                    </div>
                    <span className="tabular text-[13.5px] font-semibold text-ink">{d.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2 border-t border-divider pt-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-3 py-1 text-[13px] font-semibold text-primary">
                  <ScanSearch size={14} /> Planted error: Caught
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-hover px-3 py-1 text-[13px] font-semibold text-ink-2">
                  <ShieldCheck size={14} /> Integrity: nothing to discuss
                </span>
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}
