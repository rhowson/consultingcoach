import Link from "next/link";
import { BookOpen, Check, Clock, Flame, Minus, Play, Target, TriangleAlert } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { getDashboard } from "@/lib/services/progress";
import { COMPETENCY_LABELS, LEVEL_BAR, LEVEL_LABELS, type Verdict } from "@/lib/competency";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CompetencyChip, DifficultyDots, LevelBadge, VerdictChip } from "@/components/ui/badges";
import { PersonaAvatar } from "@/components/ui/avatar";
import { CompetencyIcon } from "@/components/ui/icons";
import { CountUp } from "@/components/home/count-up";
import { PlanAccordion } from "@/components/home/plan-accordion";

const STATUS: Record<Verdict, { label: string; color: string; Icon: typeof Check }> = {
  meets: { label: "Meets bar", color: "var(--success)", Icon: Check },
  approaching: { label: "Approaching", color: "var(--warning)", Icon: Minus },
  below: { label: "Below bar", color: "var(--danger)", Icon: TriangleAlert },
};

export default async function HomePage() {
  const user = await requirePageUser();
  const d = await getDashboard(user);
  const target = LEVEL_LABELS[d.readiness.targetLevel];
  const atBar = d.readiness.competencies.filter((c) => c.verdict === "meets").length;
  const barPct = (LEVEL_BAR / 5) * 100;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Today's rep */}
      {d.todaysRep && (
        <Card aria-labelledby="rep-title" className="flex flex-col overflow-hidden lg:col-span-12 lg:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-6 md:p-8">
            <Eyebrow className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Today&apos;s rep
            </Eyebrow>
            <div className="flex flex-col gap-1.5">
              <h2 id="rep-title" className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">
                {d.todaysRep.scenario.title}
              </h2>
              <p className="m-0 max-w-[560px] text-ink-2">{d.todaysRep.scenario.summary}</p>
            </div>
            {d.todaysRep.persona && (
              <div className="flex items-center gap-3">
                <PersonaAvatar id={d.todaysRep.persona.id} name={d.todaysRep.persona.name} />
                <div className="flex flex-col leading-snug">
                  <span className="text-sm font-semibold">{d.todaysRep.persona.name}</span>
                  <span className="text-[13px] text-muted">
                    {d.todaysRep.persona.title}, {d.todaysRep.persona.company}
                  </span>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5 rounded-md bg-subtle px-3.5 py-3 text-sm">
              <Target size={18} className="mt-px flex-none text-primary" aria-hidden />
              <span>
                Targets your #1 gap: <b className="font-semibold">{COMPETENCY_LABELS[d.gap.competency]}</b>{" "}
                {d.gap.score != null && (
                  <span className="tabular text-muted">
                    · {d.gap.score.toFixed(1)} against the {LEVEL_BAR} {target} bar
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
              <span className="flex items-center gap-1.5">
                <Clock size={16} aria-hidden />
                {d.todaysRep.scenario.durationMin} min
              </span>
              <DifficultyDots value={d.todaysRep.scenario.difficulty} />
              <LevelBadge level={d.todaysRep.scenario.targetLevel} />
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <ButtonLink href={d.todaysRep.href} size="lg">
                <Play size={18} aria-hidden />
                Start rep
              </ButtonLink>
              <ButtonLink href="/practice" variant="secondary" size="lg">
                Choose another
              </ButtonLink>
            </div>
          </div>
          {d.todaysRep.whatGoodLooksLike && (
            <div className="flex flex-none flex-col gap-3.5 border-t border-border bg-subtle p-6 md:p-8 lg:w-[340px] lg:border-t-0 lg:border-l">
              <Eyebrow>What good looks like at {LEVEL_LABELS[d.todaysRep.scenario.targetLevel]}</Eyebrow>
              {d.todaysRep.whatGoodLooksLike
                .split(/(?<=[.;])\s+/)
                .filter(Boolean)
                .map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-4 flex-none font-serif text-xl leading-none font-semibold text-accent">{i + 1}</span>
                    <span className="text-sm">{point}</span>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {/* Readiness */}
      <Card aria-labelledby="ready-title" className="flex flex-col gap-5 p-6 lg:col-span-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <CardTitle id="ready-title">Readiness for {target}</CardTitle>
          {d.targetDate && (
            <span className="text-[13px] text-muted">
              Target: {new Date(d.targetDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2.5">
            <span className="tabular text-[40px] leading-none font-semibold tracking-tight">
              <CountUp value={d.readiness.percent} />%
            </span>
            <span className="text-sm text-muted">
              {atBar} of 5 competencies at the {target} bar
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={d.readiness.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${LEVEL_LABELS[d.readiness.currentLevel]} to ${target} readiness`}
            className="relative h-2.5 rounded-full bg-hover"
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-[600ms] ease-out" style={{ width: `${d.readiness.percent}%` }} />
            <div className="absolute -top-1 -right-px -bottom-1 w-[3px] rounded-sm bg-accent" />
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-level-consultant">{LEVEL_LABELS[d.readiness.currentLevel]}</span>
            <span className="text-primary">{target}</span>
          </div>
        </div>
        <div className="flex flex-col border-t border-border">
          {d.readiness.competencies.map((c) => {
            const st = c.verdict ? STATUS[c.verdict] : null;
            return (
              <div key={c.competency} className="grid grid-cols-[1fr_auto] items-center gap-x-3.5 gap-y-2 border-b border-divider py-[11px] sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_40px_120px]">
                <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium">
                  <CompetencyIcon competency={c.competency} size={18} className="text-muted" />
                  {COMPETENCY_LABELS[c.competency]}
                </span>
                <div className="relative order-3 col-span-2 h-1.5 rounded-full bg-hover sm:order-none sm:col-span-1" aria-hidden>
                  <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${((c.score ?? 0) / 5) * 100}%`, background: st?.color }} />
                  <div className="absolute -top-[5px] -bottom-[5px] w-0.5 bg-accent" style={{ left: `${barPct}%` }} />
                </div>
                <span className="tabular text-right text-sm font-semibold">{c.score?.toFixed(1) ?? "—"}</span>
                {st && (
                  <span className="hidden items-center gap-1.5 text-[13px] text-ink-2 sm:flex">
                    <st.Icon size={15} style={{ color: st.color }} aria-hidden />
                    {st.label}
                  </span>
                )}
              </div>
            );
          })}
          <div className="flex items-center gap-2 pt-2.5 text-xs text-muted">
            <span className="h-3 w-0.5 bg-accent" />
            {target} bar {LEVEL_BAR}
          </div>
        </div>
      </Card>

      {/* This week */}
      <Card aria-labelledby="week-title" className="flex flex-col gap-5 p-6 lg:col-span-4">
        <CardTitle id="week-title">This week</CardTitle>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline gap-2">
            <span className="tabular text-[40px] leading-none font-semibold">{d.week.done}</span>
            <span className="text-sm text-muted">of {d.week.goal} reps done</span>
          </div>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${d.week.goal},1fr)` }} aria-hidden>
            {Array.from({ length: d.week.goal }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full ${i < d.week.done ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {d.week.days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-muted">{day.label}</span>
              <span
                aria-label={{ done: "Rep done", missed: "No rep", today: "Today, not yet done", upcoming: "Upcoming" }[day.state]}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-on-primary ${
                  day.state === "done"
                    ? "border border-primary bg-primary"
                    : day.state === "today"
                      ? "border-2 border-accent bg-surface"
                      : "border border-border bg-surface"
                }`}
              >
                {day.state === "done" && <Check size={14} strokeWidth={2.5} aria-hidden />}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2.5 border-t border-border pt-4 text-sm">
          <Flame size={18} className="flex-none text-warning" aria-hidden />
          <span>
            <b className="font-semibold">{d.week.streakDays}-day streak.</b>{" "}
            <span className="text-muted">{d.week.streakDays ? "One rep today keeps it." : "One rep today starts one."}</span>
          </span>
        </div>
      </Card>

      {/* Development plan */}
      <Card aria-labelledby="plan-title" className="flex flex-col gap-4 p-6 lg:col-span-8">
        <div className="flex flex-col gap-0.5">
          <CardTitle id="plan-title">Development plan</CardTitle>
          {d.plan && <span className="text-sm text-muted">Four weeks to close your {COMPETENCY_LABELS[d.plan.focus]} gap</span>}
        </div>
        {d.plan ? (
          <PlanAccordion weeks={d.plan.weeks} currentWeek={d.plan.currentWeek} />
        ) : (
          <p className="m-0 text-sm text-muted">Your plan appears after the onboarding diagnostic.</p>
        )}
      </Card>

      {/* Recent feedback */}
      <Card aria-labelledby="fb-title" className="flex flex-col gap-2 p-6 lg:col-span-4">
        <CardTitle id="fb-title" className="mb-2">
          Recent feedback
        </CardTitle>
        {d.recentFeedback.length === 0 && (
          <div className="flex flex-col items-start gap-3 border-t border-border pt-4 text-sm text-muted">
            No reps yet. Your scores and coaching show up here.
            <ButtonLink href="/practice" variant="secondary" size="sm">
              Run your first simulation
            </ButtonLink>
          </div>
        )}
        {d.recentFeedback.map((f) => (
          <Link key={f.attemptId} href={`/feedback/${f.attemptId}`} className="flex flex-col gap-2 border-t border-border py-3.5 text-ink no-underline hover:bg-subtle">
            <div className="flex items-start gap-3">
              <span className="min-w-0 flex-1 text-[15px] leading-snug font-semibold">{f.scenarioTitle}</span>
              <span className="tabular text-xl leading-tight font-semibold">{f.overallScore?.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted">
              {f.verdict && <VerdictChip verdict={f.verdict} />}
              <span>
                {f.mode === "storyboard" ? "Studio" : "Simulator"} · {relativeDay(f.completedAt)}
              </span>
            </div>
          </Link>
        ))}
      </Card>

      {/* Continue learning */}
      <section aria-labelledby="learn-title" className="flex min-w-0 flex-col gap-3.5 lg:col-span-12">
        <div className="flex items-baseline justify-between">
          <CardTitle id="learn-title">Continue learning</CardTitle>
          <Link href="/learn" className="text-sm font-medium text-primary">
            All tracks
          </Link>
        </div>
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1.5">
          {d.continueLearning.map((l) => (
            <Link
              key={l.id}
              href={`/learn/${l.id}`}
              className="flex w-[264px] flex-none snap-start flex-col gap-3 rounded-lg border border-border bg-surface p-5 text-ink no-underline hover:border-border-strong"
            >
              {l.competency && <CompetencyChip competency={l.competency} />}
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted">{l.trackTitle}</span>
                <span className="font-serif text-lg leading-snug font-semibold">{l.title}</span>
              </div>
              <div className="mt-auto flex flex-col gap-1.5">
                <div className="h-1 rounded-full bg-hover">
                  <div className="h-1 rounded-full bg-primary" style={{ width: `${l.trackProgress * 100}%` }} />
                </div>
                <span className="tabular text-xs text-muted">
                  Lesson {l.position} of {l.trackLength} · {l.durationMin} min
                </span>
              </div>
            </Link>
          ))}
          {d.continueLearning.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <BookOpen size={16} aria-hidden /> You&apos;ve completed every lesson. New tracks are on the way.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function relativeDay(date: Date | null) {
  if (!date) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

