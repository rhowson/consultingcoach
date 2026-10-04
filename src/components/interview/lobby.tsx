"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Play } from "lucide-react";
import { toApiError, type CandidateView, type InterviewApi, type PackSection } from "./client";
import { AiBadge, DurationLabel, PageShell, SectionStepper, Spinner } from "./shell";

/** Shown before each section: what's coming, then a deliberate "start the clock". */
export function Lobby({
  view,
  section,
  api,
  onView,
}: {
  view: CandidateView;
  section: PackSection;
  api: InterviewApi;
  onView: (v: CandidateView) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const index = view.pack.sections.findIndex((s) => s.id === section.id);
  const total = view.pack.sections.length;
  const previous = view.sections.at(-1);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      onView(await api.start(section.id));
    } catch (e) {
      const err = toApiError(e);
      // Someone (another tab) may already have started it: reload the real state.
      if (err.code === "wrong_section" || err.code === "section_open") {
        try {
          onView(await api.view());
          return;
        } catch {
          // Fall through to show the original error.
        }
      }
      setError(
        err.code === "ai_misconfigured"
          ? `${err.message} No time has been used — please try again later or contact your recruiter.`
          : err.code === "network"
            ? `${err.message} The timer hasn't started.`
            : err.message,
      );
      setBusy(false);
    }
  }

  return (
    <PageShell title={view.pack.title} aside={<SectionStepper sections={view.pack.sections} states={view.sections} currentId={section.id} compact />}>
      <div className="flex w-full max-w-[680px] flex-col gap-6">
        {previous && (
          <p role="status" className="m-0 rounded-md bg-success-tint px-4 py-2.5 text-sm text-ink">
            {previous.timedOut
              ? "Time ran out on the last section — your answers were saved as they were and submitted."
              : "Section submitted. Take a breath before you start the next one."}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <span className="eyebrow">
            Section {index + 1} of {total}
          </span>
          <h1 ref={headingRef} tabIndex={-1} className="m-0 font-serif text-[30px] leading-tight font-semibold focus-visible:outline-none">
            {section.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <DurationLabel min={section.durationMin} />
            <AiBadge available={section.aiAssistant} />
          </div>
        </div>

        <section aria-labelledby="iv-instructions" className="rounded-lg border border-border bg-surface p-5">
          <h2 id="iv-instructions" className="eyebrow m-0 mb-3">
            Instructions
          </h2>
          <ul className="m-0 flex flex-col gap-2.5 pl-5 text-[15px] text-ink-2">
            {section.instructions.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          {section.questions.length > 0 && (
            <p className="m-0 mt-4 text-sm text-muted">
              {section.questions.length === 1 ? "1 question" : `${section.questions.length} questions`} · the case pack stays open alongside.
            </p>
          )}
        </section>

        {error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-tint px-3 py-2.5 text-sm text-danger">
            <CircleAlert size={16} className="mt-0.5 flex-none" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void start()}
            disabled={busy}
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-[15px] font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Spinner /> : <Play size={16} aria-hidden />}
            Start section — the timer begins
          </button>
          <span className="text-sm text-muted">{section.durationMin} minutes, no pausing once started.</span>
        </div>
      </div>
    </PageShell>
  );
}
