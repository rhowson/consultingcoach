import Link from "next/link";
import { Check, Clock, Play, Target } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { PRACTICE_AREA_LABELS } from "@/lib/practice-areas";
import { getDashboard } from "@/lib/services/progress";
import { COMPETENCY_LABELS, LEVEL_BAR, LEVEL_LABELS, type Verdict } from "@/lib/competency";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { PersonaAvatar } from "@/components/ui/avatar";
import { ProgressRing } from "@/components/home/stat-tile";

const VERDICT_FILL: Record<Verdict, string> = { meets: "bg-success", approaching: "bg-warning", below: "bg-danger" };
const VERDICT_LABEL: Record<Verdict, string> = { meets: "meets the bar", approaching: "approaching the bar", below: "below the bar" };

export default async function HomePage() {
  const user = await requirePageUser();
  const d = await getDashboard(user);
  const target = LEVEL_LABELS[d.readiness.targetLevel];
  const total = d.readiness.competencies.length;
  const atBar = d.readiness.competencies.filter((c) => c.verdict === "meets").length;
  const barPct = (LEVEL_BAR / 5) * 100;
  const { greeting } = ukNow();
  const firstName = user.name.trim().split(/\s+/)[0];
  const rep = d.todaysRep;
  const thisWeek = d.plan?.weeks.find((w) => w.week === d.plan?.currentWeek) ?? d.plan?.weeks[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Where you are */}
      <section aria-labelledby="greet-title" className="glass flex flex-col gap-5 rounded-2xl p-6 shadow-md sm:flex-row sm:items-center sm:justify-between md:p-8">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 id="greet-title" className="m-0 font-display text-[28px] leading-tight font-semibold tracking-tight text-ink md:text-[36px]">
            {greeting}
            {firstName ? `, ${firstName}` : ""}.
          </h1>
          <p className="m-0 text-[15px] text-ink-2">
            {atBar === total ? (
              <>You&apos;re at the {target} bar in every competency.</>
            ) : (
              <>
                You&apos;re <b className="tabular font-semibold text-ink">{d.readiness.percent}%</b> ready for {target}, with {atBar} of {total}{" "}
                competencies at the bar.
              </>
            )}
          </p>
        </div>
        <ProgressRing percent={d.readiness.percent} label={`${d.readiness.percent}% ready for ${target}`} />
      </section>

      {/* 2. The one thing to do now */}
      {rep && (
        <Card id="next-rep" aria-labelledby="rep-title" className="flex scroll-mt-6 flex-col gap-5 p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-semibold">
            <span className="text-primary">Your next rep</span>
            {rep.scenario.practiceArea && (
              <>
                <span aria-hidden className="text-faint">
                  ·
                </span>
                <span className="text-muted">{PRACTICE_AREA_LABELS[rep.scenario.practiceArea]}</span>
              </>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h2 id="rep-title" className="m-0 font-display text-[26px] leading-tight font-semibold tracking-tight md:text-[32px]">
              {rep.scenario.title}
            </h2>
            <p className="m-0 max-w-[640px] text-[15px] text-ink-2">{rep.scenario.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-2">
            {rep.persona && (
              <span className="flex items-center gap-2.5">
                <PersonaAvatar id={rep.persona.id} name={rep.persona.name} size={32} />
                <span>
                  <b className="font-semibold text-ink">{rep.persona.name}</b>, {rep.persona.title}
                </span>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-muted">
              <Clock size={16} aria-hidden />
              {rep.scenario.durationMin} min
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <Target size={16} aria-hidden />
              Works on {COMPETENCY_LABELS[d.gap.competency].toLowerCase()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ButtonLink href={rep.href} size="lg">
              <Play size={18} aria-hidden />
              Start
            </ButtonLink>
            <Link href="/practice" className="text-sm font-semibold text-primary no-underline hover:underline">
              Choose something else
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 3. This week */}
        <Card aria-labelledby="week-title" className="flex flex-col gap-4 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="week-title" className="m-0 font-display text-xl font-semibold tracking-tight">
              This week
            </h2>
            <span className="tabular text-sm text-muted">
              {d.week.done} of {d.week.goal} reps
              {d.week.streakDays > 1 && ` · ${d.week.streakDays}-day streak`}
            </span>
          </div>
          {thisWeek ? (
            <>
              <p className="m-0 text-sm text-ink-2">
                Week {thisWeek.week}: <b className="font-semibold">{thisWeek.theme}</b>
              </p>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {thisWeek.items.map((item) => (
                  <li key={`${item.kind}-${item.refId}`}>
                    <Link href={item.href} className="flex items-center gap-3 rounded-md px-2 py-2.5 text-sm text-ink no-underline hover:bg-hover">
                      <span
                        aria-hidden
                        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ${
                          item.done ? "bg-success text-white" : "border-[1.5px] border-border-strong"
                        }`}
                      >
                        {item.done && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className={`min-w-0 flex-1 ${item.done ? "text-muted line-through" : ""}`}>
                        {item.title}
                        <span className="sr-only">{item.done ? " (done)" : ""}</span>
                      </span>
                      <span className="flex-none text-xs text-muted">{item.kind === "lesson" ? "Lesson" : "Practice"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/progress" className="mt-auto text-sm font-semibold text-primary no-underline hover:underline">
                See the full plan →
              </Link>
            </>
          ) : (
            <p className="m-0 text-sm text-muted">Your plan appears after the onboarding diagnostic.</p>
          )}
        </Card>

        {/* 4. Readiness at a glance */}
        <Card aria-labelledby="ready-title" className="flex flex-col gap-4 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ready-title" className="m-0 font-display text-xl font-semibold tracking-tight">
              Readiness for {target}
            </h2>
            <span className="text-sm text-muted">
              {atBar} of {total} at the bar
            </span>
          </div>
          <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
            {d.readiness.competencies.map((c) => (
              <li key={c.competency} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_32px] items-center gap-3 text-sm">
                <span className="truncate">{COMPETENCY_LABELS[c.competency]}</span>
                <span aria-hidden className="relative h-2 rounded-full bg-hover">
                  {c.verdict && (
                    <span className={`absolute inset-y-0 left-0 rounded-full ${VERDICT_FILL[c.verdict]}`} style={{ width: `${((c.score ?? 0) / 5) * 100}%` }} />
                  )}
                  <span className="absolute -top-1 -bottom-1 w-[3px] -translate-x-1/2 rounded-full bg-accent" style={{ left: `${barPct}%` }} />
                </span>
                <span className="tabular text-right font-semibold">
                  {c.score?.toFixed(1) ?? "—"}
                  <span className="sr-only">{c.verdict ? `, ${VERDICT_LABEL[c.verdict]}` : ", not scored"}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href="/progress" className="mt-auto text-sm font-semibold text-primary no-underline hover:underline">
            See progress →
          </Link>
        </Card>
      </div>
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
