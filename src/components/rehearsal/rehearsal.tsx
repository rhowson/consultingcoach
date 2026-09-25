"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUp, ChevronLeft, ChevronRight, CircleCheck, CircleDot, Mic, Timer, TriangleAlert } from "lucide-react";
import type { Level } from "@/lib/competency";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDialog, HintBanner, HintButton, SessionHeader, TargetPill, fmtClock } from "@/components/studio/session-header";
import { COMMITTEE, scriptQuestions, type MemberId, type RehearsalSlide } from "./script";

const ALLOT = 600; // 10-minute SteerCo slot
const ASK_DELAY_MS = 2200;

interface Question {
  id: string;
  slide: number;
  by: MemberId;
  text: string;
  follow: string;
  status: "open" | "answered";
  answer?: string;
}

const member = (id: MemberId) => COMMITTEE.find((m) => m.id === id)!;

export function Rehearsal({
  storyboardId,
  title,
  client,
  targetLevel,
  deck,
}: {
  storyboardId: string;
  title: string;
  client: string;
  targetLevel: Level;
  deck: RehearsalSlide[];
}) {
  const router = useRouter();
  const script = useMemo(() => scriptQuestions(deck), [deck]);
  const last = deck.length - 1;

  const [idx, setIdx] = useState(0);
  const [maxIdx, setMaxIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [follow, setFollow] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<"live" | "done">("live");
  const [exitOpen, setExitOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintsLeft, setHintsLeft] = useState(2);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idxRef = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (phase !== "live") return;
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  function scheduleQuestion(i: number, asked: Question[]) {
    const q = script[i];
    if (!q || asked.some((x) => x.slide === i)) return;
    later(() => {
      if (idxRef.current !== i) return;
      const id = `q${i}`;
      setQuestions((qs) => (qs.some((x) => x.id === id) ? qs : [...qs, { id, slide: i, ...q, status: "open" }]));
      setActive(id);
      setFollow(null);
      later(() => inputRef.current?.focus(), 50);
    }, ASK_DELAY_MS);
  }

  function go(d: number) {
    const i = Math.min(last, Math.max(0, idx + d));
    if (i === idx || phase !== "live") return;
    idxRef.current = i;
    setIdx(i);
    setMaxIdx((m) => Math.max(m, i));
    setHint(null);
    scheduleQuestion(i, questions);
  }

  // Keyboard: ←/→ change slides (outside the composer), Esc toggles the exit dialog.
  const goRef = useRef(go);
  useEffect(() => {
    goRef.current = go;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== "live") return;
      if (e.key === "Escape") return setExitOpen((o) => !o);
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT")) return;
      if (e.key === "ArrowRight") goRef.current(1);
      if (e.key === "ArrowLeft") goRef.current(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const activeQ = questions.find((q) => q.id === active) ?? null;
  const canAnswer = !!activeQ && activeQ.status === "open" && phase === "live";
  const who = activeQ ? member(activeQ.by) : null;

  function send() {
    const text = input.trim();
    if (!text || !activeQ || activeQ.status !== "open") return;
    const qid = activeQ.id;
    setInput("");
    const next = questions.map((x) => (x.id === qid ? { ...x, status: "answered" as const, answer: text } : x));
    setQuestions(next);
    later(() => {
      setFollow(qid);
      later(() => {
        setFollow((f) => (f === qid ? null : f));
        setActive((a) => (a === qid ? (next.find((x) => x.status === "open")?.id ?? null) : a));
      }, 2800);
    }, 700);
  }

  function restart() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    idxRef.current = 0;
    setIdx(0);
    setMaxIdx(0);
    setElapsed(0);
    setQuestions([]);
    setActive(null);
    setFollow(null);
    setInput("");
    setHint(null);
    setHintsLeft(2);
    setPhase("live");
  }

  function finish() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setExitOpen(false);
    setActive(null);
    setFollow(null);
    setPhase("done");
  }

  const answered = questions.filter((q) => q.status === "answered").length;
  const open = questions.length - answered;
  const over = elapsed > ALLOT;
  const remaining = ALLOT - elapsed;
  const left = deck.length - idx;
  const per = remaining / Math.max(left, 1);
  const pace = over
    ? { text: "Over time. Go straight to the recommendation and the ask.", Icon: TriangleAlert, cls: "text-danger" }
    : per < 60
      ? {
          text: `Running long: ${left} slide${left > 1 ? "s" : ""} left and ${fmtClock(remaining)} remaining. Land slide ${idx + 1} in one sentence.`,
          Icon: TriangleAlert,
          cls: "text-warning",
        }
      : per > 150
        ? { text: "Ahead of pace. Leave room for questions on the recommendation.", Icon: CircleCheck, cls: "text-success" }
        : { text: `On pace: about ${fmtClock(Math.round(per))} per remaining slide.`, Icon: CircleCheck, cls: "text-success" };
  const C = 2 * Math.PI * 60;
  const frac = Math.min(1, elapsed / ALLOT);
  const slide = deck[idx];

  if (phase === "done") {
    return (
      <Summary
        storyboardId={storyboardId}
        client={client}
        elapsed={elapsed}
        questions={questions}
        covered={maxIdx + 1}
        total={deck.length}
        onRestart={restart}
      />
    );
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg">
      <SessionHeader title={title} subtitle="SteerCo Rehearsal · presenting your Studio deck" onExit={() => setExitOpen(true)}>
        <TargetPill level={targetLevel} />
        <HintButton
          left={hintsLeft}
          onClick={() => {
            if (hintsLeft <= 0) return;
            setHintsLeft(hintsLeft - 1);
            setHint(
              canAnswer
                ? "Answer in one line first, then give the evidence if they want it."
                : "Say the slide title out loud, point to the one number that proves it, then move on.",
            );
          }}
        />
        <button type="button" onClick={finish} className={buttonClass("primary", "md")}>
          <span className="md:hidden">End</span>
          <span className="hidden md:inline">End presentation</span>
        </button>
      </SessionHeader>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          {/* Committee strip */}
          <div aria-label="Committee" role="group" className="relative z-[4] flex flex-none justify-center gap-4 border-b border-border bg-surface px-4 py-4 md:gap-8 md:px-8">
            {COMMITTEE.map((p) => {
              const speaking = !!activeQ && activeQ.by === p.id && (activeQ.status === "open" || follow === activeQ.id);
              const showFollow = speaking && follow === activeQ!.id;
              return (
                <div key={p.id} className="flex min-w-0 items-center gap-2.5 md:relative">
                  <div className="relative h-10 w-10 flex-none md:h-11 md:w-11">
                    {speaking && <span aria-hidden className="absolute -inset-1 animate-ping rounded-[13px] border-2 border-accent opacity-60" />}
                    <div
                      aria-hidden
                      className="relative flex h-full w-full items-center justify-center rounded-[10px] font-serif text-[15px] font-semibold text-white transition-shadow duration-200"
                      style={{ background: p.color, boxShadow: speaking ? "0 0 0 2px var(--surface), 0 0 0 4px var(--accent)" : "none" }}
                    >
                      {p.initials}
                    </div>
                  </div>
                  <div className="hidden min-w-0 flex-col leading-[1.3] md:flex">
                    <span className="text-sm font-semibold whitespace-nowrap">{p.name}</span>
                    <span className={`text-xs whitespace-nowrap ${speaking ? "text-primary" : "text-muted"}`}>{speaking ? "Speaking" : p.role}</span>
                  </div>
                  <span className="sr-only md:hidden">
                    {p.name}, {p.role}
                    {speaking ? ", speaking" : ""}
                  </span>
                  {speaking && (
                    <div
                      role="status"
                      className={`absolute top-[calc(100%+8px)] right-4 left-4 z-[6] flex flex-col gap-1.5 rounded-lg border bg-surface px-3.5 py-3 shadow-[0_12px_32px_rgba(17,24,39,.14)] transition-all duration-200 starting:-translate-y-1 starting:opacity-0 md:top-[calc(100%+14px)] md:right-auto md:left-0 md:w-[340px] ${
                        showFollow ? "border-border" : "border-accent"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute -top-[7px] left-[18px] hidden h-3 w-3 rotate-45 border-t border-l bg-surface md:block ${showFollow ? "border-border" : "border-accent"}`}
                      />
                      <span className="text-xs font-semibold text-muted">
                        {p.name} · {p.role}
                      </span>
                      <span className="text-[15px] leading-[1.45] text-ink">{showFollow ? activeQ!.follow : activeQ!.text}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Slide stage */}
          <div className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-auto px-4 py-5 md:px-8 md:pt-8 md:pb-5">
            {hint && <HintBanner text={hint} onDismiss={() => setHint(null)} className="w-full max-w-[960px]" />}
            <SlideView slide={slide} n={idx + 1} total={deck.length} client={client} />
            <div className="flex w-full max-w-[960px] items-center gap-3">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={idx === 0}
                aria-label="Previous slide"
                className="flex h-10 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-ink hover:bg-hover disabled:cursor-not-allowed disabled:text-faint"
              >
                <ChevronLeft size={16} aria-hidden />
                Prev
              </button>
              <div className="flex flex-1 justify-center gap-1.5" aria-hidden>
                {deck.map((d, i) => (
                  <span
                    key={d.id}
                    className={`h-1.5 rounded-full transition-[width] duration-200 ease-out ${i === idx ? "w-5 bg-primary" : i <= maxIdx ? "w-1.5 bg-faint" : "w-1.5 bg-border"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={idx === last}
                aria-label="Next slide"
                className="flex h-10 items-center gap-1.5 rounded-md border border-border bg-surface px-3.5 text-sm font-medium text-ink hover:bg-hover disabled:cursor-not-allowed disabled:text-faint"
              >
                Next
                <ChevronRight size={16} aria-hidden />
              </button>
            </div>
          </div>

          {/* Mobile status */}
          <div className="tabular flex flex-none items-center gap-3 border-t border-border bg-surface px-4 py-2 text-[13px] md:hidden">
            <span className={`flex items-center gap-1.5 font-semibold ${over ? "text-danger" : "text-primary"}`}>
              <Timer size={16} aria-hidden />
              {fmtClock(elapsed)} / 10:00
            </span>
            <span className="text-muted">
              {answered} answered · {open} open
            </span>
          </div>

          {/* Composer */}
          <div className="flex-none border-t border-border bg-surface px-4 pt-3 pb-4 md:px-8">
            <div className="mx-auto flex max-w-[960px] flex-col gap-1.5">
              <div
                className={`flex items-end gap-2 rounded-lg border py-1.5 pr-1.5 pl-3.5 ${canAnswer ? "border-primary bg-surface" : "border-border bg-subtle"}`}
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  aria-label={who ? `Answer ${who.name}` : "Answer the committee"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={!canAnswer}
                  placeholder={
                    canAnswer && who
                      ? `Answer ${who.name.split(" ")[0]}…`
                      : idx === last
                        ? "Land the ask, then end the presentation."
                        : "Present the slide. Questions from the committee appear here."
                  }
                  className="field-sizing-content max-h-[140px] min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base leading-normal text-ink outline-none placeholder:text-muted disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled
                  title="Voice mode is coming soon"
                  aria-label="Voice mode, coming soon"
                  className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-md text-faint"
                >
                  <Mic size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={send}
                  disabled={!canAnswer || !input.trim()}
                  aria-label="Send answer"
                  className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-on-primary hover:bg-primary-hover disabled:bg-faint"
                >
                  <ArrowUp size={18} strokeWidth={2} aria-hidden />
                </button>
              </div>
              <span className="hidden text-xs text-muted md:block">← → to change slides · Enter to answer · Esc to exit</span>
            </div>
          </div>
        </main>

        {/* Signals */}
        <aside aria-label="Session signals" className="hidden w-[300px] flex-none flex-col gap-7 overflow-y-auto border-l border-border bg-surface px-5 py-6 md:flex">
          <div className="flex flex-col items-center gap-3">
            <span className="eyebrow self-start">Time</span>
            <div className="relative h-[140px] w-[140px]">
              <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
                <circle cx="70" cy="70" r="60" fill="none" stroke="var(--hover)" strokeWidth="10" />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke={over ? "var(--danger)" : "var(--primary)"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${C * frac} ${C}`}
                  transform="rotate(-90 70 70)"
                  className="transition-[stroke-dasharray] duration-[600ms] ease-linear"
                />
              </svg>
              <div role="timer" aria-label="Time used" className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                <span className={`tabular text-2xl font-semibold ${over ? "text-danger" : "text-primary"}`}>{fmtClock(elapsed)}</span>
                <span className="text-xs text-muted">of 10:00</span>
              </div>
            </div>
            <div className="flex w-full items-start gap-2.5 rounded-md bg-subtle px-3.5 py-3 text-sm leading-[1.45]">
              <pace.Icon size={16} className={`mt-0.5 flex-none ${pace.cls}`} aria-hidden />
              <span>{pace.text}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Questions</span>
              <span className="tabular text-[13px] text-muted">
                {answered} answered · {open} open
              </span>
            </div>
            {questions.length === 0 && (
              <span className="text-sm text-muted">The committee will interrupt as you present. Answer in the box below the slide.</span>
            )}
            {questions.map((q) => {
              const p = member(q.by);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => {
                    setActive(q.id);
                    setFollow(null);
                    if (q.status === "open") inputRef.current?.focus();
                  }}
                  className={`flex items-start gap-2.5 rounded-lg border bg-surface p-2.5 text-left text-ink hover:bg-hover ${q.id === active ? "border-accent" : "border-border"}`}
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-md font-serif text-[11px] font-semibold text-white"
                    style={{ background: p.color }}
                  >
                    {p.initials}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-[13px] leading-[1.4]">
                      <span className="sr-only">{p.name}: </span>
                      {q.text}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${q.status === "open" ? "text-warning-ink" : "text-success"}`}>
                      {q.status === "open" ? <CircleDot size={13} aria-hidden /> : <CircleCheck size={13} aria-hidden />}
                      {q.status === "open" ? "Open" : "Answered"} · slide {q.slide + 1}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>
      </div>

      {exitOpen && (
        <ConfirmDialog
          title="Leave the rehearsal?"
          body="This run isn't saved or scored. Your storyboard stays as it is in the Studio."
          cancelLabel="Keep presenting"
          onCancel={() => setExitOpen(false)}
        >
          <button type="button" onClick={() => router.push(`/studio/${storyboardId}`)} className={buttonClass("destructive", "md", "h-10 px-4")}>
            Leave session
          </button>
        </ConfirmDialog>
      )}
    </div>
  );
}

function SlideView({ slide, n, total, client }: { slide: RehearsalSlide; n: number; total: number; client: string }) {
  const small = "text-[11px] md:text-[13px]";
  return (
    <div
      role="region"
      aria-roledescription="slide"
      aria-label={`Slide ${n} of ${total}`}
      className="flex w-full max-w-[960px] flex-none flex-col gap-3 overflow-hidden rounded-lg border border-border bg-surface px-4 py-4 md:aspect-video md:gap-[18px] md:px-11 md:py-9"
    >
      <div className={`flex justify-between text-muted ${small}`}>
        <span>{client}</span>
        <span className="tabular">{n}</span>
      </div>
      <h2 className="m-0 font-serif text-[17px] leading-[1.25] font-semibold tracking-[-0.01em] text-pretty text-ink md:text-[30px]">{slide.title}</h2>

      {(slide.kind === "summary" || slide.kind === "text") &&
        (slide.points.length ? (
          <ol className="m-0 flex min-h-0 flex-1 list-none flex-col justify-center gap-2 p-0 md:gap-[18px]">
            {slide.points.map((t, i) => (
              <li key={i} className="flex items-baseline gap-3 text-sm text-ink md:text-xl">
                <span className="flex-none font-serif font-semibold text-accent">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        ) : (
          <SkeletonLines />
        ))}

      {slide.kind === "chart" &&
        (slide.bars.length > 1 ? (
          <>
            <div aria-hidden className="flex min-h-[140px] flex-1 items-end gap-1 border-b border-border-strong md:min-h-0 md:gap-3">
              {slide.bars.map((b, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className={`tabular font-semibold ${small} ${b.highlight ? "text-primary" : "text-muted"}`}>{b.display}</span>
                  <div className={`w-full rounded-t-[2px] ${b.highlight ? "bg-primary" : "bg-border-strong"}`} style={{ height: `${b.pct * 0.85}%` }} />
                </div>
              ))}
            </div>
            <div aria-hidden className="-mt-1.5 flex gap-1 md:gap-3">
              {slide.bars.map((b, i) => (
                <span key={i} className={`flex-1 truncate text-center text-muted ${small}`}>
                  {b.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <EmptyExhibit />
        ))}

      {slide.kind === "table" &&
        (slide.table.length ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <table className="w-full border-collapse text-xs md:text-base">
              <tbody>
                {slide.table.map((row, r) => (
                  <tr key={r} className={r === 0 ? "font-semibold text-primary" : "border-t border-border text-ink"}>
                    {row.map((c, k) => (
                      <td key={k} className={`px-1 py-0.5 md:px-2 md:py-1.5 ${k === 0 ? "text-left" : "tabular text-right"}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyExhibit />
        ))}

      {slide.kind === "framework" && (
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-2 md:gap-[18px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-1.5 rounded-md border border-border-strong p-2 md:p-[18px]">
              <span className={`font-semibold tracking-[.06em] text-primary uppercase ${small}`}>{String(i + 1).padStart(2, "0")}</span>
              {slide.points[i] ? (
                <span className="text-xs leading-[1.35] break-words text-ink md:text-xl">{slide.points[i]}</span>
              ) : (
                <span aria-hidden className="mt-1 h-1.5 w-3/4 rounded-full bg-border" />
              )}
            </div>
          ))}
        </div>
      )}

      <span className={`text-muted ${small}`}>{slide.foot}</span>
    </div>
  );
}

function SkeletonLines() {
  return (
    <div aria-hidden className="flex flex-1 flex-col justify-center gap-3">
      <span className="h-2 w-[92%] rounded-full bg-border" />
      <span className="h-2 w-[80%] rounded-full bg-border" />
      <span className="h-2 w-[86%] rounded-full bg-border" />
    </div>
  );
}

function EmptyExhibit() {
  return (
    <div className="flex flex-1 items-center justify-center rounded border border-dashed border-border-strong text-xs text-muted md:text-sm">
      No exhibit picked for this slide
    </div>
  );
}

function Summary({
  storyboardId,
  client,
  elapsed,
  questions,
  covered,
  total,
  onRestart,
}: {
  storyboardId: string;
  client: string;
  elapsed: number;
  questions: Question[];
  covered: number;
  total: number;
  onRestart: () => void;
}) {
  const answered = questions.filter((q) => q.status === "answered").length;
  const over = elapsed > ALLOT;
  const stats = [
    { label: "Time used", value: fmtClock(elapsed), note: over ? `${fmtClock(elapsed - ALLOT)} over the slot` : "of a 10:00 slot" },
    { label: "Questions answered", value: `${answered} / ${questions.length}`, note: questions.length ? `${questions.length - answered} left open` : "No questions raised" },
    { label: "Slides covered", value: `${covered} / ${total}`, note: covered === total ? "You reached the ask" : `Stopped at slide ${covered}` },
  ];
  const headline =
    covered === total && answered === questions.length && !over
      ? "You held the room and landed the ask."
      : covered < total
        ? "The committee didn't get to the answer."
        : "Solid storyline. The room got away from you in places.";

  return (
    <main className="min-h-dvh overflow-y-auto bg-bg px-4 py-6 md:px-8 md:py-12">
      <div className="mx-auto flex max-w-[760px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Rehearsal complete · {client} SteerCo</span>
          <h1 className="m-0 font-serif text-[28px] leading-[1.15] font-semibold tracking-[-0.015em] md:text-[32px]">{headline}</h1>
        </div>
        <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-5">
              <dt className="eyebrow">{s.label}</dt>
              <dd className="tabular m-0 text-[28px] leading-tight font-semibold">{s.value}</dd>
              <dd className="m-0 text-[13px] text-muted">{s.note}</dd>
            </div>
          ))}
        </dl>
        {questions.length > 0 && (
          <section aria-labelledby="qa-title" className="rounded-lg border border-border bg-surface px-6 py-2">
            <h2 id="qa-title" className="sr-only">
              Committee questions
            </h2>
            {questions.map((q, i) => {
              const p = member(q.by);
              return (
                <div key={q.id} className={`flex flex-col gap-2 py-4 ${i ? "border-t border-border" : ""}`}>
                  <span className="text-xs text-muted">
                    Slide {q.slide + 1} · {p.name}, {p.role}
                  </span>
                  <p className="m-0 font-serif text-[17px] leading-[1.45] font-semibold">“{q.text}”</p>
                  {q.answer ? (
                    <p className="m-0 text-sm text-ink-2">
                      <span className="font-semibold text-ink">You: </span>
                      {q.answer}
                    </p>
                  ) : (
                    <p className="m-0 text-sm text-warning-ink">Left unanswered.</p>
                  )}
                </div>
              );
            })}
          </section>
        )}
        <div className="flex flex-wrap items-center gap-3 border-t border-border py-4">
          <button type="button" onClick={onRestart} className={buttonClass("secondary", "lg", "mr-auto")}>
            Rehearse again
          </button>
          <Link href={`/studio/${storyboardId}`} className={buttonClass("ghost", "lg")}>
            Back to Studio
          </Link>
          <Link href="/" className={buttonClass("primary", "lg")}>
            Back to Home
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </main>
  );
}
