"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Check, CircleAlert, CircleCheck, CircleX, Clock, Lightbulb, PanelsTopLeft, Target, ThumbsDown, ThumbsUp } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import type { Level } from "@/lib/competency";
import type { LessonBlock } from "@/lib/types";
import { Card, Eyebrow } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/badges";
import { Markdown } from "./markdown";

export interface LessonData {
  id: string;
  title: string;
  level: Level;
  durationMin: number;
  blocks: LessonBlock[];
  completed: boolean;
  quizScore: number | null;
  practice: { id: string; kind: string; title: string; durationMin: number } | null;
}

type QuizBlock = Extract<LessonBlock, { type: "quiz" }>;

export function LessonView({ lesson }: { lesson: LessonData }) {
  const router = useRouter();
  const quizIdx = lesson.blocks.flatMap((b, i) => (b.type === "quiz" ? [i] : []));
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(lesson.completed);
  const [savedScore, setSavedScore] = useState(lesson.quizScore);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = quizIdx.filter((i) => answers[i] != null);
  const correct = answered.filter((i) => answers[i] === (lesson.blocks[i] as QuizBlock).answerIndex).length;
  const allAnswered = quizIdx.length > 0 && answered.length === quizIdx.length;
  const score = allAnswered ? Math.round((correct / quizIdx.length) * 100) : undefined;

  async function markComplete() {
    setBusy(true);
    setError(null);
    try {
      await api.learn.complete(lesson.id, score);
      setCompleted(true);
      if (score != null) setSavedScore(score);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const practiceHref = lesson.practice
    ? lesson.practice.kind === "storyboard"
      ? `/studio/new?case=${encodeURIComponent(lesson.practice.id)}`
      : `/practice?start=${encodeURIComponent(lesson.practice.id)}`
    : null;

  return (
    <article className="flex flex-col gap-8" aria-labelledby="lesson-title">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
          <LevelBadge level={lesson.level} />
          <span className="flex items-center gap-1.5">
            <Clock size={15} aria-hidden />
            {lesson.durationMin} min read
          </span>
          {completed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-tint py-px pr-2 pl-1.5 text-xs font-semibold text-success">
              <CircleCheck size={13} aria-hidden /> Completed
            </span>
          )}
        </div>
        <h2 id="lesson-title" className="m-0 font-serif text-[28px] leading-tight font-semibold tracking-tight md:text-[32px]">
          {lesson.title}
        </h2>
      </header>

      <div className="flex flex-col gap-6 text-[17px] leading-relaxed text-ink-2">
        {lesson.blocks.map((b, i) => {
          switch (b.type) {
            case "text":
              return <Markdown key={i} source={b.markdown} />;
            case "key_idea":
              return (
                <aside key={i} aria-label="Key idea" className="flex flex-col gap-2 rounded-r-lg border-l-[3px] border-accent bg-accent-tint/60 py-4 pr-5 pl-5">
                  <Eyebrow className="flex items-center gap-1.5 text-accent-ink">
                    <Lightbulb size={14} aria-hidden /> Key idea
                  </Eyebrow>
                  <Markdown source={b.markdown} className="font-serif text-lg leading-snug text-ink" />
                </aside>
              );
            case "example_pair":
              return <ExamplePair key={i} block={b} />;
            case "quiz":
              return (
                <Quiz
                  key={i}
                  n={quizIdx.indexOf(i) + 1}
                  total={quizIdx.length}
                  block={b}
                  picked={answers[i]}
                  onPick={(o) => setAnswers((a) => ({ ...a, [i]: o }))}
                />
              );
          }
        })}
      </div>

      <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {quizIdx.length > 0 && (
            <span className="tabular text-sm text-ink-2" aria-live="polite">
              {allAnswered
                ? `Quiz score: ${correct} of ${quizIdx.length} (${score}%)`
                : `Quiz: ${answered.length} of ${quizIdx.length} answered`}
              {savedScore != null && !allAnswered && <span className="text-muted"> · last saved score {savedScore}%</span>}
            </span>
          )}
          <span className="text-sm text-muted">
            {completed ? "Lesson complete. You can re-save after retaking the quiz." : "Mark the lesson complete to count it toward your plan."}
          </span>
          {error && (
            <span role="alert" className="flex items-center gap-1.5 text-sm text-danger">
              <CircleAlert size={15} aria-hidden /> {error}
            </span>
          )}
        </div>
        <Button onClick={markComplete} disabled={busy} variant={completed ? "secondary" : "primary"}>
          <Check size={16} aria-hidden />
          {busy ? "Saving…" : completed ? "Completed · save again" : "Mark complete"}
        </Button>
      </Card>

      {lesson.practice && practiceHref && (
        <Card aria-labelledby="practice-title" className="flex flex-col gap-4 border-primary/30 bg-primary-tint p-6">
          <Eyebrow>Put it into practice</Eyebrow>
          <div className="flex items-start gap-3">
            {lesson.practice.kind === "storyboard" ? (
              <PanelsTopLeft size={22} className="mt-1 flex-none text-primary" aria-hidden />
            ) : (
              <Target size={22} className="mt-1 flex-none text-primary" aria-hidden />
            )}
            <div className="flex flex-col gap-0.5">
              <h3 id="practice-title" className="m-0 font-serif text-xl font-semibold">
                {lesson.practice.title}
              </h3>
              <span className="text-sm text-muted">
                {lesson.practice.kind === "storyboard" ? "Storyboard Studio" : "Client Simulator"} · {lesson.practice.durationMin} min
              </span>
            </div>
          </div>
          <ButtonLink href={practiceHref} className="self-start">
            Start the rep <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        </Card>
      )}
    </article>
  );
}

function ExamplePair({ block }: { block: Extract<LessonBlock, { type: "example_pair" }> }) {
  return (
    <figure className="m-0 flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger-tint p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-danger uppercase">
            <ThumbsDown size={14} aria-hidden /> Weak
          </span>
          <Markdown source={block.bad} className="text-[15px] text-ink" />
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-success/40 bg-success-tint p-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-success uppercase">
            <ThumbsUp size={14} aria-hidden /> Strong
          </span>
          <Markdown source={block.good} className="text-[15px] text-ink" />
        </div>
      </div>
      <figcaption className="text-sm text-muted">
        <Markdown source={block.annotation} />
      </figcaption>
    </figure>
  );
}

function Quiz({
  block,
  n,
  total,
  picked,
  onPick,
}: {
  block: QuizBlock;
  n: number;
  total: number;
  picked: number | undefined;
  onPick: (i: number) => void;
}) {
  const done = picked != null;
  const right = picked === block.answerIndex;
  return (
    <fieldset className="m-0 flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <legend className="sr-only">
        Question {n} of {total}
      </legend>
      <Eyebrow>
        Check your understanding{total > 1 ? ` · ${n}/${total}` : ""}
      </Eyebrow>
      <div className="text-base font-semibold text-ink">
        <Markdown source={block.question} />
      </div>
      <div className="flex flex-col gap-2">
        {block.options.map((opt, i) => {
          const isAnswer = i === block.answerIndex;
          const isPicked = i === picked;
          const state = !done ? "idle" : isAnswer ? "correct" : isPicked ? "wrong" : "idle";
          return (
            <button
              key={i}
              type="button"
              disabled={done}
              aria-pressed={isPicked}
              onClick={() => onPick(i)}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-md border px-3.5 py-2.5 text-left text-[15px] text-ink disabled:cursor-default ${
                state === "correct"
                  ? "border-success bg-success-tint"
                  : state === "wrong"
                    ? "border-danger bg-danger-tint"
                    : "border-border bg-surface enabled:hover:bg-hover"
              }`}
            >
              <span className="tabular mt-px w-5 flex-none text-sm font-semibold text-muted">{String.fromCharCode(65 + i)}</span>
              <span className="min-w-0 flex-1">{opt}</span>
              {state === "correct" && (
                <span className="flex flex-none items-center gap-1 text-xs font-semibold text-success">
                  <CircleCheck size={15} aria-hidden /> Correct
                </span>
              )}
              {state === "wrong" && (
                <span className="flex flex-none items-center gap-1 text-xs font-semibold text-danger">
                  <CircleX size={15} aria-hidden /> Your answer
                </span>
              )}
            </button>
          );
        })}
      </div>
      {done && (
        <div role="status" className="flex flex-col gap-1 rounded-md bg-subtle px-3.5 py-3 text-sm text-ink-2">
          <span className={`font-semibold ${right ? "text-success" : "text-danger"}`}>{right ? "Right." : "Not quite."}</span>
          <Markdown source={block.explanation} />
        </div>
      )}
    </fieldset>
  );
}
