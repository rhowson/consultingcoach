import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { getDashboard, getProgress } from "@/lib/services/progress";
import { COMPETENCY_LABELS, LEVEL_LABELS } from "@/lib/competency";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { VerdictChip } from "@/components/ui/badges";
import { PlanAccordion } from "@/components/home/plan-accordion";
import { ReadinessCard } from "@/components/progress/readiness-card";
import { TrendChart } from "@/components/progress/trend-chart";

export const metadata = { title: "Progress · Consulting Coach" };

const MODE_LABEL: Record<string, string> = {
  simulation: "Conversation",
  storyboard: "Storyline",
  diagnostic: "Diagnostic",
};

export default async function ProgressPage() {
  const user = await requirePageUser();
  const [p, { plan }] = await Promise.all([getProgress(user), getDashboard(user)]);
  const hasScores = p.readiness.competencies.some((c) => c.score != null);
  const rows = p.readiness.competencies.map((c) => {
    const check = p.promotionChecklist.find((x) => x.competency === c.competency);
    return { ...c, recentScores: check?.recentScores ?? [], met: check?.met ?? false };
  });

  return (
    <div className="flex flex-col gap-6">
      <ReadinessCard
        target={p.readiness.targetLevel}
        percent={p.readiness.percent}
        rows={rows}
        empty={
          hasScores ? undefined : (
            <div className="flex flex-col items-start gap-3 rounded-md bg-subtle p-5 text-sm text-muted">
              Finish the onboarding diagnostic or a first rep to see where you stand.
              <ButtonLink href="/practice" variant="secondary" size="sm">
                Go to Practice
              </ButtonLink>
            </div>
          )
        }
      />

      {/* Development plan */}
      <Card aria-labelledby="plan-title" className="flex flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-col gap-0.5">
          <CardTitle id="plan-title">Development plan</CardTitle>
          {plan && <span className="text-sm text-muted">Four weeks to close your {COMPETENCY_LABELS[plan.focus]} gap</span>}
        </div>
        {plan ? (
          <PlanAccordion weeks={plan.weeks} currentWeek={plan.currentWeek} />
        ) : (
          <p className="m-0 rounded-md bg-subtle p-5 text-sm text-muted">Your plan appears after the onboarding diagnostic.</p>
        )}
      </Card>

      {/* Trend */}
      <Card aria-labelledby="trend-title" className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-col gap-0.5">
          <CardTitle id="trend-title">Trend</CardTitle>
          <span className="text-sm text-muted">Last 12 weeks</span>
        </div>
        {p.trend.length ? (
          <TrendChart points={p.trend.map((t) => ({ competency: t.competency, score: t.score, at: t.at.toISOString() }))} now={new Date().toISOString()} />
        ) : (
          <p className="m-0 rounded-md bg-subtle p-5 text-sm text-muted">No score changes in the last 12 weeks.</p>
        )}
      </Card>

      {/* Attempts */}
      <Card aria-labelledby="attempts-title" className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
        <CardTitle id="attempts-title">Attempt history</CardTitle>
        {p.attempts.length ? (
          <div className="relative -mx-5 overflow-x-auto px-5 md:-mx-6 md:px-6">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">Completed reps, most recent first</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Date
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Scenario
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Mode
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Level
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-semibold">
                    Score
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Verdict
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    <span className="sr-only">Report</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.attempts.map((a) => (
                  <tr key={a.attemptId} className="border-b border-divider last:border-b-0 hover:bg-subtle">
                    <td className="tabular py-3 pr-3 whitespace-nowrap text-muted">
                      {a.completedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) ?? "—"}
                    </td>
                    <td className="py-3 pr-3 font-medium">{a.scenarioTitle}</td>
                    <td className="py-3 pr-3 text-ink-2">{MODE_LABEL[a.mode] ?? a.mode}</td>
                    <td className="py-3 pr-3 text-ink-2">{LEVEL_LABELS[a.targetLevel]}</td>
                    <td className="tabular py-3 pr-3 text-right font-semibold">{a.overallScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-3 pr-3">{a.verdict && <VerdictChip verdict={a.verdict} />}</td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/feedback/${a.attemptId}`}
                        className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-primary no-underline hover:underline"
                      >
                        Report <ArrowRight size={14} aria-hidden />
                        <span className="sr-only"> for {a.scenarioTitle}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-md bg-subtle p-5 text-sm text-muted">
            No completed reps yet. Your history shows up here.
            {hasScores && (
              <ButtonLink href="/practice" variant="secondary" size="sm">
                Go to Practice
              </ButtonLink>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
