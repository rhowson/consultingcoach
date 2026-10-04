"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CircleAlert, ClipboardList, Eye, MessageSquareText, MonitorSmartphone, Save, Sparkles, Timer } from "lucide-react";
import { toApiError, type CandidateView, type InterviewApi } from "./client";
import { AiBadge, DurationLabel, PageShell, Spinner } from "./shell";

export function Welcome({ view, api, onView }: { view: CandidateView; api: InterviewApi; onView: (v: CandidateView) => void }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const checkId = useId();
  const first = view.candidateName.split(/\s+/)[0] || view.candidateName;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function consent() {
    if (!agreed || busy) return;
    setBusy(true);
    setError(null);
    try {
      onView(await api.consent());
    } catch (e) {
      setError(toApiError(e).message);
      setBusy(false);
    }
  }

  const rules: { Icon: typeof Timer; text: React.ReactNode }[] = [
    { Icon: Timer, text: "Each section is timed. Once you start a section the timer can't be paused, and sections must be taken in order." },
    { Icon: Sparkles, text: "An AI assistant is available only in section 2, and only for questions about the case." },
    { Icon: MessageSquareText, text: "Everything you type to the AI assistant is recorded and forms part of your assessment." },
    {
      Icon: Eye,
      text: "Integrity signals — such as leaving this tab and pasting text — are recorded and shared with the assessors. They are reviewed by people, not used to fail you automatically.",
    },
    { Icon: MonitorSmartphone, text: "Please use a laptop or desktop computer with a reliable connection." },
    { Icon: Save, text: "Your progress saves automatically. There's no need to refresh the page; if you do lose your connection, reopen this link and carry on." },
  ];

  return (
    <PageShell title={view.pack.title}>
      <div className="flex w-full max-w-[720px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Welcome, {first}</span>
          <h1 ref={headingRef} tabIndex={-1} className="m-0 font-serif text-[30px] leading-tight font-semibold focus-visible:outline-none">
            {view.pack.title}
          </h1>
          <p className="m-0 text-ink-2">{view.pack.summary}</p>
        </div>

        <section aria-labelledby="iv-sections" className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <h2 id="iv-sections" className="m-0 font-serif text-lg font-semibold">
              {view.pack.sections.length} sections · {view.pack.totalMin} minutes
            </h2>
            <ClipboardList size={18} className="text-muted" aria-hidden />
          </div>
          <ol className="m-0 list-none p-0">
            {view.pack.sections.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-divider px-5 py-3 last:border-b-0">
                <span className="tabular flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-tint text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 font-medium">{s.title}</span>
                <DurationLabel min={s.durationMin} />
                <AiBadge available={s.aiAssistant} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="iv-rules" className="flex flex-col gap-3">
          <h2 id="iv-rules" className="m-0 font-serif text-lg font-semibold">
            Before you begin
          </h2>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {rules.map(({ Icon, text }, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] text-ink-2">
                <Icon size={18} className="mt-0.5 flex-none text-primary" aria-hidden />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
          <label htmlFor={checkId} className="flex cursor-pointer items-start gap-3">
            <input
              id={checkId}
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 flex-none accent-primary"
            />
            <span className="text-[15px]">
              <span className="font-semibold">I understand and agree.</span>{" "}
              <span className="text-ink-2">I&apos;ve read the rules above and consent to my answers, AI assistant use and integrity signals being recorded for this assessment.</span>
            </span>
          </label>
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-tint px-3 py-2.5 text-sm text-danger">
              <CircleAlert size={16} className="mt-0.5 flex-none" aria-hidden />
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void consent()}
              disabled={!agreed || busy}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-[15px] font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Spinner />}
              Continue
            </button>
            <span className="text-sm text-muted">Nothing is timed until you start the first section.</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
