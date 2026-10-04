"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Ban, CircleAlert, Hourglass, KeyRound, Loader2, RotateCcw, Timer, Trash2 } from "lucide-react";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/badges";
import { PrintButton } from "@/components/feedback/print-button";
import { assessApi, errorMessage, interviewLink, type InterviewReport } from "./client";
import { LinkPanel } from "./link-panel";
import { RecommendationChip, StatusChip, displayStatus, fmtDate, fmtDateTime, minutesBetween } from "./meta";
import { AiUsePanel, AnswersPanel, IntegrityPanel, ListCard, ScoresCard } from "./report-parts";

const SCORING_POLL_MS = 5000;
const LIVE_POLL_MS = 20000;

export function ReportView({ initial, clientName, now }: { initial: InterviewReport; clientName: string; now: number }) {
  const [report, setReport] = useState(initial);
  const [link, setLink] = useState<string | null>(null);
  const { interview: iv, pack, sections, result, events } = report;
  const status = displayStatus(iv, now);
  const scoringPending = iv.status === "submitted" && !result && !iv.scoringError;

  // Keep the page live while the candidate is working or the scorer is running.
  useEffect(() => {
    const ms = scoringPending ? SCORING_POLL_MS : iv.status === "in_progress" ? LIVE_POLL_MS : null;
    if (!ms) return;
    const t = setInterval(async () => {
      try {
        setReport(await assessApi.get(iv.id));
      } catch {
        // Try again on the next tick.
      }
    }, ms);
    return () => clearInterval(t);
  }, [scoringPending, iv.status, iv.id]);

  const sectionMinutes: Record<string, number> =
    result?.metrics.sectionMinutes ??
    Object.fromEntries(sections.filter((s) => s.submittedAt).map((s) => [s.sectionId, minutesBetween(s.startedAt, s.submittedAt!)]));
  const totalMinutes = Object.values(sectionMinutes).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link href="/assess" className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft size={16} aria-hidden />
            All interviews
          </Link>
          <PrintButton />
        </div>
        <Eyebrow>
          {pack.title} · {pack.totalMin} min
        </Eyebrow>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight break-words md:text-[32px]">{iv.candidateName}</h2>
            {iv.candidateEmail && <span className="text-sm break-all text-muted">{iv.candidateEmail}</span>}
          </div>
          {result && (
            <div className="flex flex-none flex-col items-start gap-1.5 sm:items-end">
              <span className="tabular text-[40px] leading-none font-semibold tracking-tight">
                {result.overallScore.toFixed(1)}
                <span className="text-base font-normal text-muted"> / 5</span>
              </span>
              <span className="text-xs text-muted">Overall</span>
              <RecommendationChip recommendation={result.recommendation} size="lg" />
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <StatusChip status={status} />
          <span className="flex items-center gap-1.5">
            Target <LevelBadge level={iv.targetLevel} />
          </span>
          {iv.scoringModel === "mock" ? (
            <span className="rounded-full bg-warning-tint px-2 py-px text-xs font-semibold text-warning-ink">Simulated score (practice mode)</span>
          ) : iv.scoringModel ? (
            <span className="text-xs">Scored by {iv.scoringModel}</span>
          ) : null}
        </div>

        <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border bg-surface p-4 text-sm sm:grid-cols-4">
          <Timing label="Invited" value={fmtDate(iv.createdAt)} />
          <Timing label="Started" value={fmtDateTime(iv.startedAt)} />
          <Timing label="Submitted" value={fmtDateTime(iv.submittedAt)} />
          <Timing label="Time used" value={totalMinutes ? `${Math.round(totalMinutes * 10) / 10} of ${pack.totalMin} min` : "—"} />
          {sections.length > 0 && (
            <div className="col-span-2 flex flex-col gap-1.5 border-t border-divider pt-3 sm:col-span-4">
              <dt className="text-xs text-muted">Minutes per section</dt>
              <dd className="m-0">
                <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 sm:grid-cols-2">
                  {pack.sections.map((p, i) => {
                    const st = sections.find((s) => s.sectionId === p.id);
                    const m = sectionMinutes[p.id];
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-ink-2">
                          {i + 1}. {p.title}
                        </span>
                        <span className="tabular flex flex-none items-center gap-1.5 text-ink">
                          {st?.timedOut && <Timer size={13} className="text-warning-ink" aria-label="Timed out" />}
                          {m != null ? `${m} / ${p.durationMin}` : st ? "in progress" : "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </dd>
            </div>
          )}
        </dl>

        {result?.summary && <p className="m-0 max-w-[720px] text-[15px] text-ink-2">{result.summary}</p>}
      </header>

      {link && <LinkPanel link={link} candidateName={iv.candidateName} onDismiss={() => setLink(null)} />}

      <StatusNotice report={report} status={status} onReport={setReport} />

      {result && (
        <>
          <ScoresCard result={result} />
          {(result.strengths.length > 0 || result.concerns.length > 0) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ListCard id="strengths-title" title="Strengths" items={result.strengths} tone="success" />
              <ListCard id="concerns-title" title="Concerns" items={result.concerns} tone="warning" />
            </div>
          )}
        </>
      )}

      {sections.length > 0 && (
        <>
          <AiUsePanel pack={pack} result={result} events={events} />
          <IntegrityPanel pack={pack} sections={sections} result={result} events={events} />
          <AnswersPanel pack={pack} sections={sections} events={events} sectionMinutes={sectionMinutes} clientName={clientName} />
        </>
      )}

      {result && result.followUpQuestions.length > 0 && (
        <section aria-labelledby="followup-title" className="flex flex-col gap-3">
          <CardTitle id="followup-title">Follow-up questions for the live interview</CardTitle>
          <ListCard id="followup-list-title" title="Ask the candidate" items={result.followUpQuestions} tone="neutral" />
        </section>
      )}

      <AssessorNotes interviewId={iv.id} initialNotes={iv.assessorNotes ?? ""} onReport={setReport} />

      <ActionsCard report={report} onReport={setReport} onLink={setLink} />
    </div>
  );
}

function Timing({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="tabular m-0 text-ink">{value}</dd>
    </div>
  );
}

// ---------------------------------------------------------------------
// Status notices
// ---------------------------------------------------------------------

function StatusNotice({
  report,
  status,
  onReport,
}: {
  report: InterviewReport;
  status: ReturnType<typeof displayStatus>;
  onReport: (r: InterviewReport) => void;
}) {
  const { interview: iv, result, sections, pack } = report;

  if (iv.status === "submitted" && !result && !iv.scoringError) {
    return (
      <Card className="flex items-start gap-3 p-5 print:hidden">
        <Loader2 size={20} className="mt-0.5 flex-none animate-spin text-primary motion-reduce:animate-none" aria-hidden />
        <div role="status" className="flex flex-col gap-1">
          <span className="font-semibold">Scoring in progress</span>
          <span className="text-sm text-muted">The candidate has submitted. Scoring usually takes a minute or two; this page updates on its own.</span>
        </div>
      </Card>
    );
  }
  if (iv.scoringError && (iv.status === "submitted" || iv.status === "scored")) {
    return (
      <Card className="flex flex-col gap-3 border-danger/40 p-5 print:hidden sm:flex-row sm:items-start sm:justify-between">
        <div role="alert" className="flex items-start gap-3">
          <CircleAlert size={20} className="mt-0.5 flex-none text-danger" aria-hidden />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-danger">Scoring failed</span>
            <span className="text-sm break-words text-ink-2">{iv.scoringError}</span>
            {result && <span className="text-sm text-muted">The scores below are from an earlier run.</span>}
          </div>
        </div>
        <RescoreButton interviewId={iv.id} onReport={onReport} />
      </Card>
    );
  }
  if (status === "expired") {
    return (
      <Notice Icon={Hourglass} title="This invite has expired">
        The link expired on {fmtDate(iv.expiresAt)} without being used. Regenerate the link below to send the candidate a new one.
      </Notice>
    );
  }
  if (iv.status === "invited") {
    return (
      <Notice Icon={KeyRound} title="Waiting for the candidate to start">
        The link is valid until {fmtDateTime(iv.expiresAt)}. The report fills in as they work through the exercise.
      </Notice>
    );
  }
  if (iv.status === "in_progress") {
    const current = sections.findIndex((s) => !s.submittedAt);
    const sectionNo = current === -1 ? sections.length : current + 1;
    return (
      <Notice Icon={Timer} title="The candidate is taking the exercise now">
        Section {sectionNo} of {pack.sections.length}. Scores appear once they submit; this page refreshes every 20 seconds.
      </Notice>
    );
  }
  if (iv.status === "revoked") {
    return (
      <Notice Icon={Ban} title="This interview was revoked">
        The candidate&apos;s link no longer works. Anything they completed before it was revoked is shown below.
      </Notice>
    );
  }
  return null;
}

function Notice({ Icon, title, children }: { Icon: typeof Timer; title: string; children: React.ReactNode }) {
  return (
    <Card className="flex items-start gap-3 p-5 print:hidden">
      <Icon size={20} className="mt-0.5 flex-none text-muted" aria-hidden />
      <div className="flex flex-col gap-1">
        <span className="font-semibold">{title}</span>
        <span className="text-sm text-muted">{children}</span>
      </div>
    </Card>
  );
}

function RescoreButton({ interviewId, onReport, variant = "primary" }: { interviewId: string; onReport: (r: InterviewReport) => void; variant?: "primary" | "secondary" }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    setBusy(true);
    setError(null);
    try {
      onReport(await assessApi.rescore(interviewId));
    } catch (err) {
      setError(errorMessage(err, "Couldn't re-run scoring. Please try again."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button variant={variant} onClick={run} disabled={busy} aria-busy={busy}>
        {busy ? <Loader2 size={16} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <RotateCcw size={16} aria-hidden />}
        {busy ? "Re-running scoring…" : "Re-run scoring"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------
// Assessor notes (autosaved)
// ---------------------------------------------------------------------

function AssessorNotes({ interviewId, initialNotes, onReport }: { interviewId: string; initialNotes: string; onReport: (r: InterviewReport) => void }) {
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<"idle" | "pending" | "saving" | "saved" | "error">("idle");
  const saved = useRef(initialNotes);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (value: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (value === saved.current) {
        setState((s) => (s === "pending" ? "saved" : s));
        return;
      }
      setState("saving");
      try {
        const r = await assessApi.update(interviewId, { assessorNotes: value });
        saved.current = value;
        onReport(r);
        setState("saved");
      } catch {
        setState("error");
      }
    },
    [interviewId, onReport],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Warn before leaving with unsaved notes.
  useEffect(() => {
    if (state !== "pending" && state !== "saving" && state !== "error") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state]);

  function change(value: string) {
    setNotes(value);
    setState("pending");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(value), 1000);
  }

  const label = { idle: "Saved automatically", pending: "Unsaved changes…", saving: "Saving…", saved: "Saved", error: "Couldn't save. Retrying when you next edit." }[state];

  return (
    <section aria-labelledby="notes-title" className="flex flex-col gap-3">
      <CardTitle id="notes-title">Assessor notes</CardTitle>
      <Card className="flex flex-col gap-2 p-5 md:p-6">
        <label htmlFor="assessor-notes" className="text-sm text-muted print:hidden">
          Private to assessors. Use them for live-interview observations and the hiring decision.
        </label>
        <textarea
          id="assessor-notes"
          value={notes}
          maxLength={10_000}
          rows={6}
          onChange={(e) => change(e.target.value)}
          onBlur={() => void save(notes)}
          aria-describedby="notes-status"
          className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-[15px] text-ink focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary print:hidden"
        />
        <div className="hidden text-[15px] whitespace-pre-wrap text-ink print:block">{notes || "No notes."}</div>
        <span id="notes-status" role="status" className={`text-xs print:hidden ${state === "error" ? "text-danger" : "text-muted"}`}>
          {label}
        </span>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------

function ActionsCard({
  report,
  onReport,
  onLink,
}: {
  report: InterviewReport;
  onReport: (r: InterviewReport) => void;
  onLink: (link: string) => void;
}) {
  const router = useRouter();
  const iv = report.interview;
  const [confirming, setConfirming] = useState<"link" | "revoke" | null>(null);
  const [busy, setBusy] = useState<"link" | "revoke" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");

  async function regenerate() {
    setBusy("link");
    setError(null);
    try {
      const { token } = await assessApi.regenerateLink(iv.id);
      onLink(interviewLink(token));
      onReport(await assessApi.get(iv.id));
      setConfirming(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(errorMessage(err, "Couldn't regenerate the link."));
    } finally {
      setBusy(null);
    }
  }

  async function revoke() {
    setBusy("revoke");
    setError(null);
    try {
      onReport(await assessApi.update(iv.id, { revoke: true }));
      setConfirming(null);
    } catch (err) {
      setError(errorMessage(err, "Couldn't revoke the interview."));
    } finally {
      setBusy(null);
    }
  }

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (deleteName.trim() !== iv.candidateName.trim()) return;
    setBusy("delete");
    setError(null);
    try {
      await assessApi.remove(iv.id);
      router.replace("/assess");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete the interview."));
      setBusy(null);
    }
  }

  const canLink = iv.status === "invited";
  const canRevoke = iv.status === "invited" || iv.status === "in_progress";
  const canRescore = iv.status === "submitted" || iv.status === "scored";
  const nameMatches = deleteName.trim() === iv.candidateName.trim();

  return (
    <section aria-labelledby="actions-title" className="flex flex-col gap-3 print:hidden">
      <CardTitle id="actions-title">Manage interview</CardTitle>
      <Card className="flex flex-col gap-5 p-5 md:p-6">
        {(canLink || canRevoke || canRescore) && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {canLink && (
                <Button variant="secondary" onClick={() => setConfirming("link")} disabled={busy !== null} aria-expanded={confirming === "link"}>
                  <KeyRound size={16} aria-hidden />
                  Regenerate link
                </Button>
              )}
              {canRevoke && (
                <Button variant="secondary" onClick={() => setConfirming("revoke")} disabled={busy !== null} aria-expanded={confirming === "revoke"}>
                  <Ban size={16} aria-hidden />
                  Revoke
                </Button>
              )}
              {canRescore && <RescoreButton interviewId={iv.id} onReport={onReport} variant="secondary" />}
            </div>

            {confirming === "link" && (
              <ConfirmRow
                text="This issues a new link and the current one stops working. The new link is valid for 14 days."
                confirmLabel={busy === "link" ? "Regenerating…" : "Regenerate link"}
                busy={busy === "link"}
                onConfirm={regenerate}
                onCancel={() => setConfirming(null)}
              />
            )}
            {confirming === "revoke" && (
              <ConfirmRow
                text={
                  iv.status === "in_progress"
                    ? `${iv.candidateName} is taking the exercise now. Revoking stops them immediately and can't be undone. Their work so far is kept.`
                    : `The candidate's link will stop working. This can't be undone.`
                }
                confirmLabel={busy === "revoke" ? "Revoking…" : "Revoke interview"}
                destructive
                busy={busy === "revoke"}
                onConfirm={revoke}
                onCancel={() => setConfirming(null)}
              />
            )}
          </div>
        )}

        <form onSubmit={remove} className="flex flex-col gap-3 border-t border-border pt-5">
          <div className="flex flex-col gap-1">
            <h3 className="m-0 text-[15px] font-semibold text-danger">Delete interview</h3>
            <p className="m-0 text-sm text-ink-2">
              Permanently removes all of this candidate&apos;s data: their answers, the assistant log, the client conversation, integrity signals,
              scores and your notes. This can&apos;t be undone. Download a PDF first if you need to keep a record.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="del-name" className="text-sm font-medium">
                Type <span className="font-semibold">{iv.candidateName}</span> to confirm
              </label>
              <input
                id="del-name"
                value={deleteName}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setDeleteName(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink focus-visible:border-danger focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-danger"
              />
            </div>
            <Button type="submit" variant="destructive" disabled={!nameMatches || busy !== null} className="h-10">
              <Trash2 size={16} aria-hidden />
              {busy === "delete" ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </form>

        {error && (
          <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
            <CircleAlert size={16} aria-hidden /> {error}
          </p>
        )}
      </Card>
    </section>
  );
}

function ConfirmRow({
  text,
  confirmLabel,
  destructive = false,
  busy,
  onConfirm,
  onCancel,
}: {
  text: string;
  confirmLabel: string;
  destructive?: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div role="group" aria-label="Confirm" className="flex flex-col gap-3 rounded-md bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="m-0 text-sm text-ink-2">{text}</p>
      <div className="flex flex-none gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant={destructive ? "destructive" : "primary"} onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
