import { notFound } from "next/navigation";
import { ArrowRight, Hourglass, Play, RotateCcw, TrendingUp } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { getReport, loadOwnedAttempt } from "@/lib/services/attempts";
import { targetLevelFor } from "@/lib/services/progress";
import { HttpError } from "@/lib/api/http";
import { LEVEL_BAR, LEVEL_LABELS } from "@/lib/competency";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PrintButton } from "@/components/feedback/print-button";
import { RubricScore } from "@/components/feedback/rubric-score";
import { MomentCard } from "@/components/feedback/moment-card";
import { RetrySimButton } from "@/components/feedback/retry-button";
import { ReportPoller } from "@/components/feedback/report-poller";

export const metadata = { title: "Feedback · Consulting Coach" };

const HEADLINE = {
  meets: (lvl: string) => `You met the ${lvl} bar.`,
  approaching: (lvl: string) => `Close. A behaviour or two from the ${lvl} bar.`,
  below: (lvl: string) => `Below the ${lvl} bar this time.`,
} as const;

const MODE_LABEL: Record<string, string> = { simulation: "Client conversation", storyboard: "Storyline", diagnostic: "Diagnostic" };

export default async function FeedbackPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const user = await requirePageUser();
  const { attemptId } = await params;

  let report;
  try {
    report = await getReport(user, attemptId);
  } catch (err) {
    if (err instanceof HttpError && err.code === "report_not_ready") return <NotReady attempt={await loadOwnedAttempt(user, attemptId)} />;
    if (err instanceof HttpError && err.status === 404) notFound();
    throw err;
  }

  const { attempt, scenario } = report;
  const level = LEVEL_LABELS[attempt.targetLevel];
  const isSim = attempt.mode === "simulation" || attempt.mode === "diagnostic";
  const date = (attempt.completedAt ?? report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const behaviours = report.topBehaviours.slice(0, 3);
  const readinessChange = report.readiness.after - report.readiness.before;

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8">
      {/* (a) Header: title, verdict, overall score */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{[MODE_LABEL[attempt.mode], date].filter(Boolean).join(" · ")}</Eyebrow>
          <PrintButton />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">{scenario.title}</h2>
            {report.verdict && <p className="m-0 font-serif text-lg font-semibold text-ink-2">{HEADLINE[report.verdict](level)}</p>}
            {report.summary && <p className="m-0 max-w-[620px] text-[15px] text-ink-2">{report.summary}</p>}
          </div>
          {report.overallScore != null && (
            <div className="flex flex-none flex-col items-start gap-1.5 sm:items-end">
              <span className="tabular text-[40px] leading-none font-semibold tracking-tight">
                {report.overallScore.toFixed(1)}
                <span className="text-base font-normal text-muted"> / 5</span>
              </span>
              <span className="text-xs text-muted">Overall</span>
              {report.scoringModel === "mock" && (
                <span className="inline-flex h-6 items-center rounded-full bg-warning-tint px-2.5 text-xs font-semibold text-warning-ink">Simulated score</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* (b) What to change next time */}
      {behaviours.length > 0 && (
        <section aria-labelledby="change-title" className="flex flex-col gap-3">
          <CardTitle id="change-title">What to change next time</CardTitle>
          <Card className="p-5 md:p-6">
            <ol className="m-0 list-decimal space-y-3 pl-5 text-[15px] text-ink marker:font-semibold marker:text-primary">
              {behaviours.map((b, i) => (
                <li key={i} className="pl-1">
                  {b}
                </li>
              ))}
            </ol>
          </Card>
        </section>
      )}

      {/* (c) The moment that mattered */}
      {report.moments.length > 0 && (
        <section aria-labelledby="moments-title" className="flex flex-col gap-3">
          <CardTitle id="moments-title">{report.moments.length === 1 ? "The moment that mattered" : "Moments that mattered"}</CardTitle>
          <div className="flex flex-col gap-4">
            {report.moments.map((m, i) => (
              <MomentCard key={`${m.ref}-${i}`} moment={m} mode={attempt.mode} scenarioId={scenario.id} attemptId={attempt.id} />
            ))}
          </div>
        </section>
      )}

      {/* (d) Scores: rationale on demand */}
      {report.criteria.length > 0 && (
        <section aria-labelledby="scores-title" className="flex flex-col gap-3">
          <CardTitle id="scores-title">Scores</CardTitle>
          <Card className="flex flex-col gap-2 px-5 pt-2 pb-4 md:px-6">
            <ul className="m-0 list-none p-0">
              {report.criteria.map((c) => (
                <RubricScore key={c.criterionId} label={c.label} score={c.score} rationale={c.rationale} />
              ))}
            </ul>
            <div className="flex items-center gap-2 text-xs text-muted">
              <span aria-hidden className="h-3 w-0.5 bg-accent" />
              {level} bar {LEVEL_BAR}
            </div>
          </Card>
        </section>
      )}

      {/* (e) Footer: readiness change and next step */}
      <footer className="flex flex-col gap-5 border-t border-border pt-6">
        <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
          <TrendingUp size={16} className="text-primary" aria-hidden />
          <span>
            Readiness for {LEVEL_LABELS[targetLevelFor(user)]}:{" "}
            <span className="tabular font-semibold">
              {report.readiness.before}% → {report.readiness.after}%
            </span>{" "}
            <span className="tabular text-muted">
              ({readinessChange > 0 ? "+" : ""}
              {readinessChange} pts)
            </span>
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {isSim ? (
            <RetrySimButton scenarioId={scenario.id} size="lg">
              Retry scenario
            </RetrySimButton>
          ) : (
            <ButtonLink href={`/studio/new?case=${scenario.id}`} variant="secondary" size="lg">
              <RotateCcw size={16} aria-hidden />
              Retry scenario
            </ButtonLink>
          )}
          <ButtonLink href="/#next-rep" size="lg" className="sm:ml-auto">
            Next recommended rep
            <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        </div>
      </footer>
    </div>
  );
}

function NotReady({ attempt }: { attempt: Awaited<ReturnType<typeof loadOwnedAttempt>> }) {
  const resumeHref = attempt.mode === "simulation" ? `/practice/sim/${attempt.id}` : "/practice?tab=storylines";
  const state =
    attempt.status === "evaluating"
      ? {
          title: "Your coach is still reviewing",
          body: "Scoring usually takes under a minute. This page updates on its own when the report is ready.",
          action: null,
        }
      : attempt.status === "in_progress"
        ? {
            title: "This rep isn't finished yet",
            body: "Feedback appears once you end the conversation or submit your storyboard.",
            action: (
              <ButtonLink href={resumeHref} size="lg">
                <Play size={18} aria-hidden />
                Resume
              </ButtonLink>
            ),
          }
        : {
            title: "No feedback for this rep",
            body: "You left this session before the end, so it wasn't scored. Start it again when you're ready.",
            action: (
              <ButtonLink href={attempt.mode === "simulation" ? `/practice?start=${attempt.scenarioId}` : `/studio/new?case=${attempt.scenarioId}`} size="lg">
                <RotateCcw size={16} aria-hidden />
                Start again
              </ButtonLink>
            ),
          };

  return (
    <Card className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-6 py-12 text-center">
      {attempt.status === "evaluating" && <ReportPoller />}
      <Hourglass size={28} className="text-faint" aria-hidden />
      <div role="status" className="flex flex-col gap-2">
        <CardTitle>{state.title}</CardTitle>
        <p className="m-0 text-sm text-muted">{state.body}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {state.action}
        <ButtonLink href="/practice" variant="secondary" size="lg">
          Back to Practice
        </ButtonLink>
      </div>
    </Card>
  );
}
