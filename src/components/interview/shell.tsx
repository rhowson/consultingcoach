"use client";

import { Check, CircleAlert, Clock, LaptopMinimal, Link2Off, RotateCw, Sparkles } from "lucide-react";
import type { PackSection, SectionStateView } from "./client";

/** Keyframes the interview UI needs; React 19 hoists and dedupes this <style>. */
export function InterviewStyles() {
  return (
    <style href="cc-interview" precedence="default">{`
@keyframes ivDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@keyframes ivFade{from{opacity:0;transform:translate(-50%,-4px)}to{opacity:1;transform:translate(-50%,0)}}
@keyframes ivSpin{to{transform:rotate(360deg)}}
.iv-dot{animation:ivDot 1.2s infinite ease-in-out}
.iv-toast{animation:ivFade 200ms ease-out}
.iv-spin{animation:ivSpin 1s linear infinite}
`}</style>
  );
}

/** Top bar for the non-timed screens (welcome, lobby, finished, errors). */
export function PageShell({ title, children, aside }: { title?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <InterviewStyles />
      <header className="flex h-[60px] flex-none items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
        <span className="eyebrow flex-none">Assessment</span>
        {title && (
          <>
            <span className="h-6 w-px flex-none bg-border" aria-hidden />
            <span className="min-w-0 truncate font-serif text-[17px] font-semibold">{title}</span>
          </>
        )}
        <div className="flex-1" />
        {aside}
      </header>
      <SmallScreenNotice />
      <main className="flex flex-1 justify-center px-4 py-8 lg:py-12">{children}</main>
    </div>
  );
}

export function SmallScreenNotice() {
  return (
    <div role="note" className="flex flex-none items-start gap-2.5 border-b border-border bg-warning-tint px-4 py-2.5 text-sm text-ink lg:hidden">
      <LaptopMinimal size={16} className="mt-0.5 flex-none text-warning-ink" aria-hidden />
      <span>This exercise is designed for a laptop or desktop. You can continue on this screen, but a larger screen will make it much easier.</span>
    </div>
  );
}

type StepState = "done" | "current" | "upcoming";

/** Four-step progress through the sections. */
export function SectionStepper({
  sections,
  states,
  currentId,
  compact = false,
}: {
  sections: PackSection[];
  states: SectionStateView[];
  currentId: string | null;
  compact?: boolean;
}) {
  const stateOf = (id: string): StepState => {
    if (id === currentId) return "current";
    return states.some((s) => s.sectionId === id && s.submittedAt) ? "done" : "upcoming";
  };
  return (
    <nav aria-label="Exercise progress">
      <ol className="m-0 flex list-none items-center gap-1.5 p-0">
        {sections.map((s, i) => {
          const st = stateOf(s.id);
          return (
            <li key={s.id} aria-current={st === "current" ? "step" : undefined} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className={`h-px w-4 flex-none ${st === "upcoming" ? "bg-border-strong" : "bg-primary"} ${compact ? "" : "xl:w-6"}`} />}
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-semibold ${
                  st === "done"
                    ? "bg-primary text-on-primary"
                    : st === "current"
                      ? "border-2 border-primary bg-primary-tint text-primary"
                      : "border border-border-strong bg-surface text-muted"
                }`}
              >
                {st === "done" ? <Check size={13} strokeWidth={3} aria-hidden /> : <span aria-hidden>{i + 1}</span>}
              </span>
              {!compact && (
                <span aria-hidden className={`hidden text-[13px] xl:inline ${st === "current" ? "font-semibold text-ink" : "text-muted"}`}>
                  {s.title}
                </span>
              )}
              <span className="sr-only">
                Section {i + 1}: {s.title} ({st === "done" ? "completed" : st === "current" ? "current" : "not started"})
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function AiBadge({ available }: { available: boolean }) {
  return available ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-tint px-2 py-px text-xs font-semibold text-accent-ink">
      <Sparkles size={12} aria-hidden />
      AI assistant available
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-border px-2 py-px text-xs font-medium text-muted">No AI</span>
  );
}

export function DurationLabel({ min }: { min: number }) {
  return (
    <span className="tabular inline-flex items-center gap-1 text-[13px] text-muted">
      <Clock size={13} aria-hidden />
      {min} min
    </span>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return <RotateCw size={size} className="iv-spin flex-none" aria-hidden />;
}

/** Friendly full-page error: bad link, expired link, AI unavailable, network trouble. */
export function ErrorScreen({
  kind,
  message,
  onRetry,
  retrying,
}: {
  kind: "invalid" | "expired" | "network" | "unavailable";
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const copy = {
    invalid: {
      title: "This link isn't valid",
      body: "The interview link may have been mistyped, replaced with a new one, or withdrawn. Please check the email you received or contact your recruiter.",
    },
    expired: { title: "This link has expired", body: message ?? "This interview link has expired. Please contact your recruiter for a new one." },
    network: { title: "We couldn't load your exercise", body: message ?? "Check your connection and try again. Your progress is saved." },
    unavailable: { title: "The exercise isn't available right now", body: message ?? "Please try again in a few minutes, or contact your recruiter." },
  }[kind];
  const Icon = kind === "invalid" || kind === "expired" ? Link2Off : CircleAlert;
  return (
    <PageShell>
      <div className="flex w-full max-w-[520px] flex-col items-center gap-4 pt-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint text-danger">
          <Icon size={22} aria-hidden />
        </span>
        <h1 className="m-0 font-serif text-2xl font-semibold">{copy.title}</h1>
        <p className="m-0 text-ink-2">{copy.body}</p>
        {(onRetry || kind === "network" || kind === "unavailable") && (
          <button
            type="button"
            onClick={onRetry ?? (() => window.location.reload())}
            disabled={retrying}
            className="mt-2 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {retrying ? <Spinner /> : <RotateCw size={16} aria-hidden />}
            Try again
          </button>
        )}
      </div>
    </PageShell>
  );
}

export function FinishedScreen({ name, title }: { name: string; title: string }) {
  const first = name.split(/\s+/)[0] || name;
  return (
    <PageShell title={title}>
      <div className="flex w-full max-w-[560px] flex-col items-center gap-4 pt-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-tint text-success">
          <Check size={24} strokeWidth={2.5} aria-hidden />
        </span>
        <h1 tabIndex={-1} className="m-0 font-serif text-[28px] font-semibold focus-visible:outline-none">
          Thank you, {first}
        </h1>
        <p className="m-0 text-ink-2">Your responses have been submitted. The hiring team will be in touch.</p>
        <p className="m-0 text-sm text-muted">You can now close this window.</p>
      </div>
    </PageShell>
  );
}
