import Link from "next/link";
import { ArrowRight, Check, Circle, TrendingUp } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { getProgress } from "@/lib/services/progress";
import { COMPETENCY_LABELS, LEVEL_BAR, LEVEL_LABELS } from "@/lib/competency";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { LevelBadge, VerdictChip } from "@/components/ui/badges";
import { CompetencyMatrix } from "@/components/progress/competency-matrix";
import { TrendChart } from "@/components/progress/trend-chart";
import { SERIES } from "@/components/progress/series";

export const metadata = { title: "Progress · Consulting Coach" };

const MODE_LABEL: Record<string, string> = {
  simulation: "Simulator",
  storyboard: "Studio",
  rehearsal: "Rehearsal",
  diagnostic: "Diagnostic",
};

export default async function ProgressPage() {
  const user = await requirePageUser();
  const p = await getProgress(user);
  const target = p.readiness.targetLevel;
  const hasScores = p.readiness.competencies.some((c) => c.score != null);
  const metCount = p.promotionChecklist.filter((c) => c.met).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Matrix */}
      <Card aria-labelledby="matrix-title" className="flex flex-col gap-4 p-6 lg:col-span-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <CardTitle id="matrix-title">Competency matrix</CardTitle>
          <span className="flex items-center gap-2 text-[13px] text-muted">
            <LevelBadge level={p.readiness.currentLevel} solid />
            <ArrowRight size={14} aria-hidden />
            <LevelBadge level={target} />
            <span className="tabular font-semibold text-ink">{p.readiness.percent}%</span>
          </span>
        </div>
        {hasScores ? (
          <CompetencyMatrix rows={p.readiness.competencies} current={p.readiness.currentLevel} target={target} />
        ) : (
          <Empty text="Finish the onboarding diagnostic or a first rep to place yourself on the matrix." href="/practice" cta="Run a rep" />
        )}
      </Card>

      {/* Promotion readiness */}
      <Card aria-labelledby="promo-title" className="flex flex-col gap-4 p-6 lg:col-span-4">
        <div className="flex flex-col gap-1">
          <CardTitle id="promo-title">Promotion readiness</CardTitle>
          <p className="m-0 text-sm text-ink-2">
            Ready for <b className="font-semibold">{LEVEL_LABELS[target]}</b> when all 5 competencies score ≥ {LEVEL_BAR} in 3 consecutive reps.
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="tabular text-[32px] leading-none font-semibold">{metCount}</span>
          <span className="text-sm text-muted">of 5 met</span>
        </div>
        <ul className="m-0 flex list-none flex-col border-t border-border p-0">
          {p.promotionChecklist.map((c) => (
            <li key={c.competency} className="flex items-center gap-3 border-b border-divider py-2.5 last:border-b-0">
              {c.met ? (
                <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success text-white">
                  <Check size={12} strokeWidth={2.5} aria-hidden />
                </span>
              ) : (
                <Circle size={20} className="flex-none text-border-strong" aria-hidden />
              )}
              <span className="min-w-0 flex-1 text-sm font-medium">
                {COMPETENCY_LABELS[c.competency]}
                <span className="sr-only">{c.met ? ": met" : ": not yet met"}</span>
              </span>
              <span className="flex gap-1" aria-label={c.recentScores.length ? `Last reps: ${c.recentScores.map((s) => s.toFixed(1)).join(", ")}` : "No reps yet"}>
                {[0, 1, 2].map((i) => {
                  const s = c.recentScores[i];
                  return (
                    <span
                      key={i}
                      aria-hidden
                      className={`tabular flex h-6 w-9 items-center justify-center rounded text-xs font-semibold ${
                        s == null ? "border border-dashed border-border-strong text-faint" : s >= LEVEL_BAR ? "bg-success-tint text-success" : "bg-warning-tint text-warning-ink"
                      }`}
                    >
                      {s == null ? "–" : s.toFixed(1)}
                    </span>
                  );
                })}
              </span>
            </li>
          ))}
        </ul>
        <p className="m-0 text-xs text-muted">Most recent rep first. Onboarding placement doesn&apos;t count as a rep.</p>
      </Card>

      {/* Trend */}
      <Card aria-labelledby="trend-title" className="flex min-w-0 flex-col gap-4 p-6 lg:col-span-12">
        <div className="flex flex-col gap-0.5">
          <CardTitle id="trend-title">Trend</CardTitle>
          <span className="text-sm text-muted">Last 12 weeks · one point each time a score changed</span>
        </div>
        {p.trend.length ? (
          <>
            <TrendChart points={p.trend.map((t) => ({ competency: t.competency, score: t.score, at: t.at.toISOString() }))} now={new Date().toISOString()} />
            <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-xs text-muted" aria-hidden>
              {p.readiness.competencies.map((c) => (
                <li key={c.competency} className="flex items-center gap-1.5">
                  <svg width="22" height="8" aria-hidden>
                    <line x1="1" x2="21" y1="4" y2="4" stroke={SERIES[c.competency].color} strokeWidth="2" strokeDasharray={SERIES[c.competency].dash} />
                  </svg>
                  {COMPETENCY_LABELS[c.competency]}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Empty text="No score changes in the last 12 weeks. Complete a rep to start your trend line." href="/practice" cta="Go to Practice" />
        )}
      </Card>

      {/* Attempts */}
      <Card aria-labelledby="attempts-title" className="flex min-w-0 flex-col gap-4 p-6 lg:col-span-12">
        <CardTitle id="attempts-title">Attempt history</CardTitle>
        {p.attempts.length ? (
          <div className="-mx-6 overflow-x-auto px-6">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <caption className="sr-only">Completed reps, most recent first</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">Date</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Scenario</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Mode</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Level</th>
                  <th scope="col" className="py-2 pr-3 text-right font-semibold">Score</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Verdict</th>
                  <th scope="col" className="py-2 font-semibold"><span className="sr-only">Report</span></th>
                </tr>
              </thead>
              <tbody>
                {p.attempts.map((a) => (
                  <tr key={a.attemptId} className="border-b border-divider hover:bg-subtle">
                    <td className="tabular py-3 pr-3 whitespace-nowrap text-muted">
                      {a.completedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) ?? "—"}
                    </td>
                    <td className="py-3 pr-3 font-medium">{a.scenarioTitle}</td>
                    <td className="py-3 pr-3 text-ink-2">{MODE_LABEL[a.mode] ?? a.mode}</td>
                    <td className="py-3 pr-3"><LevelBadge level={a.targetLevel} /></td>
                    <td className="tabular py-3 pr-3 text-right font-semibold">{a.overallScore?.toFixed(1) ?? "—"}</td>
                    <td className="py-3 pr-3">{a.verdict && <VerdictChip verdict={a.verdict} />}</td>
                    <td className="py-3 text-right">
                      <Link href={`/feedback/${a.attemptId}`} className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-primary no-underline hover:underline">
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
          <Empty text="No completed reps yet. Your history and scores will show up here." href="/practice" cta="Run your first simulation" />
        )}
      </Card>
    </div>
  );
}

function Empty({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-md bg-subtle p-5 text-sm text-muted">
      <span className="flex items-center gap-2">
        <TrendingUp size={16} aria-hidden /> {text}
      </span>
      <ButtonLink href={href} variant="secondary" size="sm">
        {cta}
      </ButtonLink>
    </div>
  );
}
