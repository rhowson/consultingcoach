import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChartNoAxesColumn,
  Clock,
  Flame,
  Gauge,
  GraduationCap,
  ListChecks,
  MessageSquareText,
  MessagesSquare,
  PanelsTopLeft,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { PRACTICE_AREA_LABELS } from "@/lib/practice-areas";
import { getDashboard } from "@/lib/services/progress";
import { COMPETENCY_LABELS, LEVEL_BAR, LEVEL_LABELS, type Verdict } from "@/lib/competency";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { DifficultyDots, LevelBadge, VerdictChip } from "@/components/ui/badges";
import { PersonaAvatar } from "@/components/ui/avatar";
import { COMPETENCY_ICON, IconChip } from "@/components/ui/icons";
import { CountUp } from "@/components/home/count-up";
import { PlanAccordion } from "@/components/home/plan-accordion";
import { SectionHeader } from "@/components/home/section-header";
import { ProgressRing, StatTile } from "@/components/home/stat-tile";

const VERDICT_FILL: Record<Verdict, string> = { meets: "bg-success", approaching: "bg-warning", below: "bg-danger" };
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_STATE: Record<string, string> = { done: "rep done", missed: "no rep", today: "today, not yet done", upcoming: "upcoming" };

export default async function HomePage() {
  const user = await requirePageUser();
  const d = await getDashboard(user);
  const target = LEVEL_LABELS[d.readiness.targetLevel];
  const current = LEVEL_LABELS[d.readiness.currentLevel];
  const total = d.readiness.competencies.length;
  const atBar = d.readiness.competencies.filter((c) => c.verdict === "meets").length;
  const barPct = (LEVEL_BAR / 5) * 100;
  const { greeting, today } = ukNow();
  const firstName = user.name.trim().split(/\s+/)[0];
  const targetMonth = d.targetDate ? new Date(d.targetDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : null;
  const repsLeft = Math.max(0, d.week.goal - d.week.done);
  const rep = d.todaysRep;
  const repAside = rep && (rep.persona || rep.whatGoodLooksLike);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Greeting: frosted glass over the shell's sky band. */}
      <section aria-labelledby="greet-title" className="glass flex flex-col gap-5 rounded-2xl p-6 shadow-md md:flex-row md:items-end md:justify-between md:p-8 lg:col-span-12">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="eyebrow">{today}</span>
          <h1 id="greet-title" className="m-0 font-display text-[30px] leading-[1.1] font-semibold tracking-tight text-ink md:text-[40px]">
            {greeting}
            {firstName ? `, ${firstName}` : ""}.
            <span className="block text-primary">{atBar === total ? `You're at the ${target} bar.` : `Let's get you to ${target}.`}</span>
          </h1>
          <p className="m-0 max-w-[560px] text-[15px] text-ink-2">
            You&apos;re <b className="tabular font-semibold text-ink">{d.readiness.percent}%</b> of the way from {current} to {target}, with{" "}
            {atBar} of {total} competencies at the bar.
          </p>
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2">
          <LevelBadge level={d.readiness.currentLevel} solid />
          <span aria-hidden className="text-faint">
            →
          </span>
          <LevelBadge level={d.readiness.targetLevel} />
          {targetMonth && (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface px-2.5 text-xs font-semibold text-ink-2 shadow-sm">
              <CalendarDays size={13} aria-hidden />
              Target {targetMonth}
            </span>
          )}
        </div>
      </section>

      {/* Stat tiles */}
      <ul aria-label="Your stats" className="m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:col-span-12 xl:grid-cols-4">
        <StatTile
          Icon={Gauge}
          label="Readiness"
          value={
            <>
              <CountUp value={d.readiness.percent} />%
            </>
          }
          caption={
            <>
              {current} → <span className="font-semibold text-primary">{target}</span>
            </>
          }
          chart={<ProgressRing percent={d.readiness.percent} label={`${current} to ${target} readiness`} />}
        />
        <StatTile
          Icon={CalendarCheck}
          tone="accent"
          label="Reps this week"
          value={d.week.done}
          unit={`/ ${d.week.goal}`}
          caption={repsLeft ? `${repsLeft} to hit your weekly goal` : "Weekly goal hit. Nice work."}
          chart={
            <ol aria-label="Reps by day this week" className="m-0 flex flex-none list-none items-end gap-1 p-0">
              {d.week.days.map((day, i) => (
                <li key={i} className="flex flex-col items-center gap-1">
                  <span className="sr-only">
                    {WEEKDAYS[i]}: {DAY_STATE[day.state] ?? day.state}
                  </span>
                  <span
                    aria-hidden
                    className={`block w-2.5 rounded-full ${
                      day.state === "done"
                        ? "h-8 bg-primary"
                        : day.state === "today"
                          ? "h-8 border-2 border-dashed border-accent bg-accent-tint"
                          : day.state === "missed"
                            ? "h-2.5 bg-border-strong"
                            : "h-2.5 bg-hover"
                    }`}
                  />
                  <span aria-hidden className={`text-[10px] leading-none font-semibold ${day.state === "today" ? "text-accent-ink" : "text-faint"}`}>
                    {day.label}
                  </span>
                </li>
              ))}
            </ol>
          }
        />
        <StatTile
          Icon={Flame}
          tone="warning"
          label="Streak"
          value={d.week.streakDays}
          unit={d.week.streakDays === 1 ? "day" : "days"}
          caption={d.week.streakDays ? "One rep today keeps it." : "One rep today starts one."}
        />
        <StatTile
          Icon={Award}
          tone="success"
          label="At the bar"
          value={atBar}
          unit={`of ${total}`}
          caption={`competencies at the ${target} bar`}
          chart={
            <div aria-hidden className="relative flex h-10 flex-none items-end gap-1.5">
              {d.readiness.competencies.map((c) => (
                <span key={c.competency} className="relative h-full w-2 overflow-hidden rounded-full bg-hover">
                  <span
                    className={`absolute inset-x-0 bottom-0 rounded-full ${c.verdict ? VERDICT_FILL[c.verdict] : ""}`}
                    style={{ height: `${((c.score ?? 0) / 5) * 100}%` }}
                  />
                </span>
              ))}
              <span className="absolute inset-x-[-3px] border-t border-dashed border-accent" style={{ bottom: `${barPct}%` }} />
            </div>
          }
        />
      </ul>

      {/* Today's rep */}
      {rep && (
        <Card aria-labelledby="rep-title" className={`grid overflow-hidden lg:col-span-12 ${repAside ? "xl:grid-cols-[minmax(0,1fr)_380px]" : ""}`}>
          {!repAside && <div aria-hidden className="sky h-2" />}
          <div className="flex min-w-0 flex-col gap-5 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary px-3 text-xs font-semibold text-on-primary shadow-sm">
                <Sparkles size={14} aria-hidden />
                Today&apos;s rep
              </span>
              {rep.scenario.practiceArea && (
                <span className="inline-flex h-7 items-center rounded-full bg-primary-tint px-3 text-xs font-semibold text-primary">
                  {PRACTICE_AREA_LABELS[rep.scenario.practiceArea]}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <h2 id="rep-title" className="m-0 font-display text-[28px] leading-tight font-semibold tracking-tight md:text-[34px]">
                {rep.scenario.title}
              </h2>
              <p className="m-0 max-w-[600px] text-[15px] text-ink-2">{rep.scenario.summary}</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-subtle px-3.5 py-3 text-sm">
              <IconChip Icon={Target} size="sm" />
              <span>
                Targets your #1 gap: <b className="font-semibold">{COMPETENCY_LABELS[d.gap.competency]}</b>{" "}
                {d.gap.score != null && (
                  <span className="tabular text-muted">
                    · {d.gap.score.toFixed(1)} against the {LEVEL_BAR} {target} bar
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-muted">
              <span className="flex items-center gap-1.5">
                <Clock size={16} aria-hidden />
                {rep.scenario.durationMin} min
              </span>
              <DifficultyDots value={rep.scenario.difficulty} />
              <LevelBadge level={rep.scenario.targetLevel} />
            </div>
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <ButtonLink href={rep.href} size="lg">
                <Play size={18} aria-hidden />
                Start rep
              </ButtonLink>
              <ButtonLink href="/practice" variant="secondary" size="lg">
                Choose another
              </ButtonLink>
            </div>
          </div>

          {repAside && (
            <div className="sky grid content-start gap-3 p-5 md:grid-cols-2 md:p-6 xl:grid-cols-1">
              {rep.persona && (
                <div className="glass flex items-center gap-3 rounded-lg p-4 shadow-sm">
                  <PersonaAvatar id={rep.persona.id} name={rep.persona.name} size={48} />
                  <div className="flex min-w-0 flex-col leading-snug">
                    <span className="eyebrow text-[11px]">Your client</span>
                    <span className="text-[15px] font-semibold text-ink">{rep.persona.name}</span>
                    <span className="text-[13px] text-ink-2">
                      {rep.persona.title}, {rep.persona.company}
                    </span>
                  </div>
                </div>
              )}
              {rep.whatGoodLooksLike && (
                <div className={`glass flex flex-col gap-3 rounded-lg p-4 shadow-sm ${rep.persona ? "" : "md:col-span-2 xl:col-span-1"}`}>
                  <span className="eyebrow text-[11px]">What good looks like at {LEVEL_LABELS[rep.scenario.targetLevel]}</span>
                  <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                    {rep.whatGoodLooksLike
                      .split(/(?<=[.;])\s+/)
                      .filter(Boolean)
                      .map((point, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
                          <span
                            aria-hidden
                            className="tabular flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-on-primary"
                          >
                            {i + 1}
                          </span>
                          {point}
                        </li>
                      ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Competency readiness */}
      <Card aria-labelledby="ready-title" className="flex flex-col gap-5 p-6 lg:col-span-12 xl:col-span-8">
        <SectionHeader
          id="ready-title"
          Icon={ChartNoAxesColumn}
          title={`Readiness for ${target}`}
          subtitle={targetMonth ? `Target: ${targetMonth}` : `${atBar} of ${total} competencies at the bar`}
          href="/progress"
          linkLabel="View progress"
        />
        <ul className="m-0 flex list-none flex-col p-0">
          {d.readiness.competencies.map((c) => (
            <li
              key={c.competency}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 border-b border-divider py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_36px_120px]"
            >
              <span className="flex min-w-0 items-center gap-3 text-sm font-medium">
                <IconChip Icon={COMPETENCY_ICON[c.competency]} tone="neutral" size="sm" />
                <span className="truncate">{COMPETENCY_LABELS[c.competency]}</span>
              </span>
              <div aria-hidden className="relative order-3 col-span-2 h-2 rounded-full bg-hover sm:order-none sm:col-span-1">
                {c.verdict && (
                  <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${VERDICT_FILL[c.verdict]}`}
                    style={{ width: `${((c.score ?? 0) / 5) * 100}%` }}
                  />
                )}
                <div className="absolute -top-1 -bottom-1 w-[3px] -translate-x-1/2 rounded-full bg-accent" style={{ left: `${barPct}%` }} />
              </div>
              <span className="tabular hidden text-right text-sm font-semibold sm:block">{c.score?.toFixed(1) ?? "—"}</span>
              <span className="flex items-center justify-end gap-2.5">
                <span className="tabular text-sm font-semibold sm:hidden">{c.score?.toFixed(1) ?? "—"}</span>
                {c.verdict ? (
                  <VerdictChip verdict={c.verdict} />
                ) : (
                  <span className="inline-flex h-6 items-center rounded-full bg-hover px-2.5 text-xs font-semibold text-muted">Not scored</span>
                )}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span aria-hidden className="h-3 w-[3px] rounded-full bg-accent" />
          {target} bar {LEVEL_BAR} out of 5
        </div>
      </Card>

      {/* Recent feedback */}
      <Card aria-labelledby="fb-title" className="flex flex-col gap-4 p-6 lg:col-span-12 xl:col-span-4">
        <SectionHeader id="fb-title" Icon={MessageSquareText} tone="accent" title="Recent feedback" href="/progress" />
        {d.recentFeedback.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center gap-3 rounded-lg bg-subtle p-5 text-sm text-muted">
            No reps yet. Your scores and coaching show up here.
            <ButtonLink href="/practice" variant="secondary" size="sm">
              Run your first simulation
            </ButtonLink>
          </div>
        ) : (
          <ul className="-mx-2 my-0 flex list-none flex-col gap-1 p-0">
            {d.recentFeedback.map((f) => (
              <li key={f.attemptId}>
                <Link
                  href={`/feedback/${f.attemptId}`}
                  className="flex items-start gap-3 rounded-lg px-2 py-3 text-ink no-underline transition-colors hover:bg-hover"
                >
                  <IconChip Icon={f.mode === "storyboard" ? PanelsTopLeft : MessagesSquare} tone="neutral" size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-sm leading-snug font-semibold">{f.scenarioTitle}</span>
                    <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      {f.verdict && <VerdictChip verdict={f.verdict} />}
                      <span>
                        {f.mode === "storyboard" ? "Studio" : "Simulator"} · {relativeDay(f.completedAt)}
                      </span>
                    </span>
                  </span>
                  <span className="tabular font-display text-xl leading-tight font-semibold">
                    {f.overallScore != null ? f.overallScore.toFixed(1) : "—"}
                    <span className="sr-only"> out of 5</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Development plan */}
      <Card aria-labelledby="plan-title" className="flex flex-col gap-5 p-6 lg:col-span-12 xl:col-span-8">
        <SectionHeader
          id="plan-title"
          Icon={ListChecks}
          tone="success"
          title="Development plan"
          subtitle={d.plan ? `Four weeks to close your ${COMPETENCY_LABELS[d.plan.focus]} gap` : null}
        />
        {d.plan ? (
          <PlanAccordion weeks={d.plan.weeks} currentWeek={d.plan.currentWeek} />
        ) : (
          <p className="m-0 rounded-lg bg-subtle p-5 text-sm text-muted">Your plan appears after the onboarding diagnostic.</p>
        )}
      </Card>

      {/* Continue learning */}
      <Card aria-labelledby="learn-title" className="flex min-w-0 flex-col gap-4 p-6 lg:col-span-12 xl:col-span-4">
        <SectionHeader id="learn-title" Icon={GraduationCap} title="Continue learning" href="/learn" linkLabel="All tracks" />
        {d.continueLearning.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-subtle p-5 text-sm text-muted">
            <BookOpen size={16} className="flex-none" aria-hidden /> You&apos;ve completed every lesson. New tracks are on the way.
          </div>
        ) : (
          <ul className="-mx-2 my-0 flex list-none flex-col gap-1 p-0">
            {d.continueLearning.map((l) => (
              <li key={l.id}>
                <Link href={`/learn/${l.id}`} className="flex items-start gap-3 rounded-lg px-2 py-3 text-ink no-underline transition-colors hover:bg-hover">
                  <IconChip Icon={l.competency ? COMPETENCY_ICON[l.competency] : BookOpen} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="flex flex-col leading-snug">
                      <span className="truncate text-xs text-muted">
                        {l.trackTitle}
                        {l.competency && <span className="sr-only"> · {COMPETENCY_LABELS[l.competency]}</span>}
                      </span>
                      <span className="text-sm font-semibold">{l.title}</span>
                    </span>
                    <span className="flex items-center gap-2.5">
                      <span aria-hidden className="h-1.5 flex-1 rounded-full bg-hover">
                        <span className="block h-1.5 rounded-full bg-primary" style={{ width: `${l.trackProgress * 100}%` }} />
                      </span>
                      <span className="tabular flex-none text-xs text-muted">
                        {l.position}/{l.trackLength} · {l.durationMin} min
                        <span className="sr-only"> (lesson {l.position} of {l.trackLength})</span>
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/** Greeting and date for the current UK (Europe/London) time. */
function ukNow(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", hourCycle: "h23" }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long", day: "numeric", month: "long" }).format(now);
  return { greeting, today };
}

function relativeDay(date: Date | null) {
  if (!date) return "";
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return date.toLocaleDateString("en-GB", { weekday: "short" });
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
