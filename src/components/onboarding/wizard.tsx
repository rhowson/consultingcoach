"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Briefcase, CircleAlert, LoaderCircle, Target, TrendingUp, Wrench } from "lucide-react";
import { api, ApiError, type OnboardingResult } from "@/lib/client/api";
import {
  COMPETENCIES,
  COMPETENCY_LABELS,
  LEVELS,
  LEVEL_EXPECTATIONS,
  LEVEL_LABELS,
  nextLevel,
  type Competency,
  type Level,
} from "@/lib/competency";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { CompetencyIcon } from "@/components/ui/icons";
import { MiniSim } from "./mini-sim";
import { ResultView } from "./result-view";

type Goal = "promotion" | "break_in" | "sharpen_skill";
type Diagnostic = Awaited<ReturnType<typeof api.onboarding.get>>;

const STEPS = ["Your level", "Your goal", "Self-rating", "Mini-simulation", "Title quiz"] as const;

const LEVEL_BLURB: Record<Level, string> = {
  analyst: "Owns analyses and slides within a workstream.",
  consultant: "Runs a workstream and its client counterparts.",
  manager: "Runs the engagement, team and client lead.",
  director: "Owns the client relationship and the answer.",
};

const GOALS: { value: Goal; label: string; hint: string; Icon: typeof Target }[] = [
  { value: "promotion", label: "Get promoted", hint: "Close the gaps to the next level.", Icon: TrendingUp },
  { value: "break_in", label: "Break into consulting", hint: "Build the core skills interviewers and teams look for.", Icon: Briefcase },
  { value: "sharpen_skill", label: "Sharpen a skill", hint: "Focus on one area that matters now.", Icon: Wrench },
];

const RATING_LABEL = ["", "Beginner", "Developing", "Solid", "Strong", "Role model"];

export function OnboardingWizard({
  name,
  initial,
  rerun,
}: {
  name: string;
  initial: { currentLevel: Level; targetLevel: Level | null; goal: Goal | null; targetDate: string | null };
  rerun: boolean;
}) {
  const [step, setStep] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<Level>(initial.currentLevel);
  const [targetLevel, setTargetLevel] = useState<Level>(initial.targetLevel ?? nextLevel(initial.currentLevel) ?? initial.currentLevel);
  const [targetTouched, setTargetTouched] = useState(!!initial.targetLevel);
  const [goal, setGoal] = useState<Goal>(initial.goal ?? "promotion");
  const [targetDate, setTargetDate] = useState(initial.targetDate ?? "");
  const [ratings, setRatings] = useState<Record<Competency, number>>(
    () => Object.fromEntries(COMPETENCIES.map((c) => [c, 3])) as Record<Competency, number>,
  );
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [diag, setDiag] = useState<Diagnostic | null>(null);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  useEffect(() => {
    api.onboarding
      .get()
      .then(setDiag)
      .catch((e) => setDiagError(e instanceof ApiError ? e.message : "Couldn't load the diagnostic."));
  }, []);

  // Move focus to the step heading so keyboard and screen-reader users land at the top of each step.
  useEffect(() => {
    document.getElementById("step-heading")?.focus();
  }, [step, result]);

  function pickLevel(l: Level) {
    setCurrentLevel(l);
    if (!targetTouched) setTargetLevel(nextLevel(l) ?? l);
  }

  const quiz = diag?.titleQuiz ?? [];
  const quizDone = quiz.length > 0 && quiz.every((q) => quizAnswers[q.id] != null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.onboarding.submit({
        currentLevel,
        targetLevel,
        goal,
        targetDate: targetDate || undefined,
        selfRatings: ratings,
        quizAnswers,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <ResultView result={result} />;

  const pct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="font-semibold text-ink-2">
            Step {step + 1} of {STEPS.length} · {STEPS[step]}
          </span>
          {step === 0 && <span className="text-muted">About 8 minutes</span>}
        </div>
        <div
          role="progressbar"
          aria-label="Diagnostic progress"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-valuetext={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}
          className="grid h-1.5 gap-1"
          style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}
        >
          {STEPS.map((s, i) => (
            <span key={s} className={`rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <span className="sr-only">{Math.round(pct)}% complete</span>
      </div>

      {step === 0 && (
        <Step
          title={rerun ? `Let's re-check where you are, ${firstName(name)}` : `Welcome, ${firstName(name)}. Where are you today?`}
          lead="Pick the level you're working at now. We'll measure you against the next one up."
        >
          <fieldset className="m-0 border-0 p-0">
            <legend className="sr-only">Current level</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {LEVELS.map((l) => (
                <ChoiceCard key={l} name="level" checked={currentLevel === l} onChange={() => pickLevel(l)}>
                  <span className="font-serif text-lg font-semibold">{LEVEL_LABELS[l]}</span>
                  <span className="text-[13px] text-muted">{LEVEL_BLURB[l]}</span>
                </ChoiceCard>
              ))}
            </div>
          </fieldset>
          <div className="flex max-w-xs flex-col gap-1.5">
            <label htmlFor="ob-target" className="text-sm font-medium">
              Target level
            </label>
            <select
              id="ob-target"
              value={targetLevel}
              onChange={(e) => {
                setTargetLevel(e.target.value as Level);
                setTargetTouched(true);
              }}
              className={field}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
        </Step>
      )}

      {step === 1 && (
        <Step title="What are you working toward?" lead="This shapes the reps we suggest first.">
          <fieldset className="m-0 border-0 p-0">
            <legend className="sr-only">Goal</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {GOALS.map((g) => (
                <ChoiceCard key={g.value} name="goal" checked={goal === g.value} onChange={() => setGoal(g.value)}>
                  <g.Icon size={20} className="text-primary" aria-hidden />
                  <span className="text-[15px] font-semibold">{g.label}</span>
                  <span className="text-[13px] text-muted">{g.hint}</span>
                </ChoiceCard>
              ))}
            </div>
          </fieldset>
          <div className="flex max-w-xs flex-col gap-1.5">
            <label htmlFor="ob-date" className="text-sm font-medium">
              Target date <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="ob-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={field} />
            <span className="text-[13px] text-muted">When is your next promotion round or start date?</span>
          </div>
        </Step>
      )}

      {step === 2 && (
        <Step title="How would you rate yourself?" lead={`Against what's expected of a ${LEVEL_LABELS[targetLevel]}. Be honest — we'll check.`}>
          <div className="flex flex-col divide-y divide-divider rounded-lg border border-border bg-surface">
            {COMPETENCIES.map((c) => (
              <div key={c} className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2.5">
                  <CompetencyIcon competency={c} size={18} className="text-muted" />
                  <label htmlFor={`rate-${c}`} className="flex-1 text-sm font-semibold">
                    {COMPETENCY_LABELS[c]}
                  </label>
                  <span className="tabular text-sm font-semibold text-primary" aria-hidden>
                    {ratings[c]} · {RATING_LABEL[ratings[c]]}
                  </span>
                </div>
                <p className="m-0 text-[13px] text-muted">{LEVEL_EXPECTATIONS[c][targetLevel]}</p>
                <input
                  id={`rate-${c}`}
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={ratings[c]}
                  aria-valuetext={`${ratings[c]} of 5, ${RATING_LABEL[ratings[c]]}`}
                  onChange={(e) => setRatings((r) => ({ ...r, [c]: Number(e.target.value) }))}
                  className="w-full accent-[var(--primary)]"
                />
                <div className="flex justify-between text-[11px] text-faint" aria-hidden>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            ))}
          </div>
        </Step>
      )}

      {step === 3 && (
        <Step title="A quick conversation" lead="Handle a short client moment. It's scored like any rep, so we can see how you actually do.">
          {diagError && <ErrorLine text={diagError} />}
          <MiniSim
            scenarioId={diag?.diagnosticScenarioId ?? null}
            maxTurns={diag?.diagnosticMaxTurns ?? 3}
            onFinished={() => setStep(4)}
            onSkip={() => setStep(4)}
          />
        </Step>
      )}

      {step === 4 && (
        <Step title="Pick the best action title" lead="For each exhibit, choose the title a partner would put on the slide.">
          {!diag && !diagError && (
            <p className="m-0 flex items-center gap-2 text-sm text-muted">
              <LoaderCircle size={16} className="animate-spin" aria-hidden /> Loading…
            </p>
          )}
          {diagError && <ErrorLine text={diagError} />}
          {quiz.map((q, qi) => (
            <fieldset key={q.id} className="m-0 flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
              <legend className="sr-only">Exhibit {qi + 1}</legend>
              <Eyebrow>
                Exhibit {qi + 1} of {quiz.length}
              </Eyebrow>
              <p className="m-0 rounded-md bg-subtle px-3.5 py-3 text-sm text-ink-2">{q.exhibit}</p>
              <div className="flex flex-col gap-2">
                {q.options.map((o, oi) => (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                      quizAnswers[q.id] === oi ? "border-primary bg-primary-tint" : "border-border hover:bg-hover"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`quiz-${q.id}`}
                      checked={quizAnswers[q.id] === oi}
                      onChange={() => setQuizAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className="mt-1 accent-[var(--primary)]"
                    />
                    <span className="font-serif text-[15px] leading-snug font-semibold">{o}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {error && <ErrorLine text={error} />}
        </Step>
      )}

      {/* Nav */}
      {step !== 3 && (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0 || submitting} className={step === 0 ? "invisible" : ""}>
            <ArrowLeft size={16} aria-hidden /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((s) => s + 1)}>
              Continue <ArrowRight size={16} aria-hidden />
            </Button>
          ) : (
            <Button onClick={submit} disabled={!quizDone || submitting} size="lg">
              {submitting && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
              {submitting ? "Placing you…" : "See my results"}
            </Button>
          )}
        </div>
      )}
      {step === 3 && (
        <div className="flex border-t border-border pt-5">
          <Button variant="ghost" onClick={() => setStep(2)}>
            <ArrowLeft size={16} aria-hidden /> Back
          </Button>
        </div>
      )}
    </div>
  );
}

const field =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

function firstName(n: string) {
  return n.trim().split(/\s+/)[0] || "there";
}

function Step({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="step-heading" className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 id="step-heading" tabIndex={-1} className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight outline-none md:text-[32px]">
          {title}
        </h1>
        <p className="m-0 text-ink-2">{lead}</p>
      </div>
      {children}
    </section>
  );
}

function ChoiceCard({ name, checked, onChange, children }: { name: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label
      className={`relative flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
        checked ? "border-primary bg-primary-tint shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <input type="radio" name={name} checked={checked} onChange={onChange} className="sr-only" />
      {children}
    </label>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <Card className="flex items-center gap-2 border-danger/40 p-3 text-sm text-danger" role="alert">
      <CircleAlert size={16} aria-hidden /> {text}
    </Card>
  );
}
