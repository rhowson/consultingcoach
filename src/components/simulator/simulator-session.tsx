"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, CircleAlert, Lightbulb, Mic, TrendingDown, TrendingUp, X } from "lucide-react";
import { api, ApiError, type SimulationView } from "@/lib/client/api";
import type { Mood } from "@/lib/types";
import { MOODS } from "@/lib/types";
import { MOOD_META } from "./mood-meter";
import { SessionHeader, fmtClock } from "./session-header";
import { BriefingPanel } from "./briefing-panel";
import { SignalsPanel } from "./signals-panel";
import { PersonaBubble, SystemDivider, TypingBubble, UserBubble } from "./chat-bubble";
import { ExitDialog } from "./exit-dialog";
import { ReviewingOverlay, SimStyles } from "./reviewing-overlay";

interface Msg {
  key: string;
  role: "user" | "persona" | "system";
  content: string;
  turn?: number;
  time?: string;
}

type Toast = { kind: "up" | "down" | "error"; text: string };
type Sheet = "brief" | "signals" | null;

const FALLBACK_PERSONA = { id: "unknown", name: "The client", title: "Client", company: "" };

export function SimulatorSession({ initial }: { initial: SimulationView }) {
  const router = useRouter();
  const id = initial.attempt.id;
  const { scenario } = initial;
  const persona = initial.persona ?? FALLBACK_PERSONA;
  const first = persona.name.split(" ")[0];

  const [messages, setMessages] = useState<Msg[]>(() => initialMessages(initial, persona.name));
  const [streaming, setStreaming] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [mood, setMood] = useState<Mood>(initial.attempt.mood);
  const [objectivesMet, setObjectivesMet] = useState<string[]>(initial.attempt.objectivesMet);
  const [metAt, setMetAt] = useState<Record<string, number>>({});
  const [hintsLeft, setHintsLeft] = useState(initial.hintsRemaining);
  const [hint, setHint] = useState<string | null>(null);
  const [hintBusy, setHintBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);
  const [phase, setPhase] = useState<"live" | "reviewing">(initial.attempt.status === "evaluating" ? "reviewing" : "live");
  const [exitOpen, setExitOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [elapsed, setElapsed] = useState(0);
  const [announce, setAnnounce] = useState("");

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const briefCloseRef = useRef<HTMLButtonElement>(null);
  const signalsCloseRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const endTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const elapsedRef = useRef(0);
  const moodRef = useRef(mood);
  const metRef = useRef(objectivesMet);
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const live = phase === "live";
  const objectives = scenario.objectives.map((o) => ({ ...o, met: objectivesMet.includes(o.id), metAt: metAt[o.id] }));
  const metCount = objectives.filter((o) => o.met).length;
  const m = MOOD_META[mood];

  // Timer, measured from when the attempt started (survives reloads).
  useEffect(() => {
    if (!live) return;
    const started = new Date(initial.attempt.startedAt).getTime();
    const tick = () => {
      const secs = Math.max(0, Math.floor((Date.now() - started) / 1000));
      elapsedRef.current = secs;
      setElapsed(secs);
    };
    const iv = setInterval(tick, 1000);
    const kickoff = setTimeout(tick, 0);
    return () => {
      clearInterval(iv);
      clearTimeout(kickoff);
    };
  }, [live, initial.attempt.startedAt]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, streaming]);

  // Focus the composer on desktop (avoid popping the keyboard on phones).
  useEffect(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) inputRef.current?.focus();
  }, []);

  // Move focus into a bottom sheet when it opens.
  useEffect(() => {
    if (sheet === "brief") briefCloseRef.current?.focus();
    if (sheet === "signals") signalsCloseRef.current?.focus();
  }, [sheet]);

  // Esc: close a sheet first, otherwise open the exit dialog (the dialog handles its own Esc).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented || !live || exitOpen) return;
      if (sheet) setSheet(null);
      else setExitOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [live, exitOpen, sheet]);

  // If we landed mid-evaluation (e.g. reload), wait for the report.
  useEffect(() => {
    if (initial.attempt.status !== "evaluating") return;
    const iv = setInterval(() => {
      api
        .feedback(id)
        .then(() => router.push(`/feedback/${id}`))
        .catch(() => {});
    }, 3000);
    return () => clearInterval(iv);
  }, [id, initial.attempt.status, router]);

  useEffect(
    () => () => {
      clearTimeout(toastTimer.current);
      clearTimeout(endTimer.current);
    },
    [],
  );

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), t.kind === "error" ? 5000 : 2600);
  }, []);

  const finish = useCallback(async () => {
    if (phaseRef.current !== "live") return;
    clearTimeout(endTimer.current);
    phaseRef.current = "reviewing";
    setPhase("reviewing");
    setExitOpen(false);
    setSheet(null);
    try {
      await api.simulations.complete(id);
      router.push(`/feedback/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "attempt_busy") {
        router.push(`/feedback/${id}`);
        return;
      }
      phaseRef.current = "live";
      setPhase("live");
      showToast({ kind: "error", text: e instanceof ApiError ? e.message : "The coach couldn't review this session. Try again." });
    }
  }, [id, router, showToast]);

  function endNow() {
    if (userTurns === 0) {
      showToast({ kind: "error", text: `Say something to ${first} before ending the conversation.` });
      return;
    }
    void finish();
  }

  async function send() {
    const text = input.trim();
    if (!text || pending || !live || ended) return;
    const key = `u-${Date.now()}`;
    const turnNo = userTurns + 1;
    const time = fmtClock(elapsedRef.current);
    setMessages((ms) => [...ms, { key, role: "user", content: text, time }]);
    setInput("");
    setPending(true);
    setStreaming("");
    setError(null);
    setHint(null);

    const rollback = (message: string) => {
      setMessages((ms) => ms.filter((x) => x.key !== key));
      setInput((cur) => (cur.trim() ? `${text}\n${cur}` : text));
      setError(message);
    };

    try {
      for await (const ev of api.simulations.send(id, text)) {
        if (ev.type === "user_message") {
          setMessages((ms) => ms.map((x) => (x.key === key ? { ...x, turn: ev.turn } : x)));
        } else if (ev.type === "delta") {
          setStreaming((s) => (s ?? "") + ev.text);
        } else if (ev.type === "persona_message") {
          setStreaming(null);
          setMessages((ms) => [...ms, { key: `p-${ev.turn}`, role: "persona", content: ev.content, turn: ev.turn, time: fmtClock(elapsedRef.current) }]);
          setAnnounce(`${persona.name}: ${ev.content}`);
        } else if (ev.type === "signals") {
          const prevMood = moodRef.current;
          if (prevMood !== ev.mood) {
            const up = MOODS.indexOf(ev.mood) > MOODS.indexOf(prevMood);
            showToast({ kind: up ? "up" : "down", text: `${first} is now ${MOOD_META[ev.mood].label.toLowerCase()}` });
          }
          moodRef.current = ev.mood;
          setMood(ev.mood);
          const fresh = ev.objectivesMet.filter((o) => !metRef.current.includes(o));
          if (fresh.length) setMetAt((ma) => ({ ...ma, ...Object.fromEntries(fresh.map((o) => [o, turnNo])) }));
          metRef.current = ev.objectivesMet;
          setObjectivesMet(ev.objectivesMet);
          if (ev.ended) {
            setEnded(true);
            setMessages((ms) => [
              ...ms,
              {
                key: "ended",
                role: "system",
                content: turnNo >= scenario.maxTurns ? "Turn limit reached · the meeting is over" : `${first} has ended the conversation`,
              },
            ]);
            endTimer.current = setTimeout(() => void finish(), 2500);
          }
        } else if (ev.type === "error") {
          rollback(ev.message);
        }
      }
    } catch (e) {
      rollback(e instanceof ApiError ? e.message : "Couldn't reach the client. Check your connection and try again.");
    } finally {
      setPending(false);
      setStreaming(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  async function requestHint() {
    if (hintBusy || hintsLeft <= 0) return;
    setHintBusy(true);
    try {
      const r = await api.simulations.hint(id);
      setHint(r.hint);
      setHintsLeft(r.hintsRemaining);
    } catch (e) {
      if (e instanceof ApiError && e.code === "no_hints") setHintsLeft(0);
      showToast({ kind: "error", text: e instanceof ApiError ? e.message : "Couldn't get a hint." });
    } finally {
      setHintBusy(false);
    }
  }

  async function leave() {
    setLeaving(true);
    try {
      await api.simulations.abandon(id);
    } catch {
      // Leaving should never be blocked; the attempt simply stays in progress.
    }
    router.push("/practice");
  }

  const sheetClass = (which: Exclude<Sheet, null>) =>
    sheet === which
      ? "fixed inset-x-0 bottom-0 z-40 flex max-h-[80dvh] flex-col overflow-y-auto rounded-t-xl bg-surface shadow-[0_-8px_32px_rgba(0,0,0,0.16)] lg:static lg:z-auto lg:max-h-none lg:w-[280px] lg:flex-none lg:rounded-none lg:shadow-none"
      : "hidden lg:flex lg:w-[280px] lg:flex-none lg:flex-col lg:overflow-y-auto lg:bg-surface";

  const sheetHeader = (title: string, ref: React.RefObject<HTMLButtonElement | null>) => (
    <div className="flex items-center justify-between px-5 pt-4 lg:hidden">
      <span className="font-serif text-xl font-semibold">{title}</span>
      <button
        ref={ref}
        type="button"
        onClick={() => setSheet(null)}
        aria-label={`Close ${title.toLowerCase()}`}
        className="flex h-9 w-9 items-center justify-center rounded-md bg-transparent text-ink-2 hover:bg-hover"
      >
        <X size={20} aria-hidden />
      </button>
    </div>
  );

  const canSend = Boolean(input.trim()) && !pending && live && !ended;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg">
      <SimStyles />
      <SessionHeader
        title={scenario.title}
        subtitle={`Client Simulator${persona.company ? ` · ${persona.company}` : ""}`}
        elapsed={elapsed}
        durationMin={scenario.durationMin}
        targetLevel={initial.attempt.targetLevel}
        hintsLeft={hintsLeft}
        hintBusy={hintBusy}
        live={live && !ended}
        onExit={() => setExitOpen(true)}
        onHint={requestHint}
        onEnd={endNow}
      />

      {/* Mobile status strip */}
      <div className="flex flex-none items-center gap-2 border-b border-border bg-surface px-4 py-2 lg:hidden">
        <span className="flex items-center gap-1.5 text-[13px] font-semibold">
          <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: m.ring }} />
          <span className="sr-only">Client mood: </span>
          {m.label}
        </span>
        <span className="tabular min-w-0 truncate text-[13px] text-muted">
          · Turn {userTurns} · {metCount}/{objectives.length} objectives
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setSheet("brief")}
          aria-expanded={sheet === "brief"}
          aria-controls="sim-brief"
          className="h-8 flex-none rounded-md border border-border bg-surface px-2.5 text-[13px] font-medium text-ink hover:bg-hover"
        >
          Brief
        </button>
        <button
          type="button"
          onClick={() => setSheet("signals")}
          aria-expanded={sheet === "signals"}
          aria-controls="sim-signals"
          className="h-8 flex-none rounded-md border border-border bg-surface px-2.5 text-[13px] font-medium text-ink hover:bg-hover"
        >
          Signals
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside id="sim-brief" aria-label="Brief" className={`${sheetClass("brief")} lg:border-r lg:border-border`}>
          {sheetHeader("Brief", briefCloseRef)}
          <BriefingPanel briefing={scenario.briefing} notesKey={`cc:sim-notes:${id}`} />
        </aside>

        <section aria-label="Conversation" className="relative flex min-w-0 flex-1 flex-col">
          {toast && (
            <div
              role="status"
              className="cc-toast absolute top-4 left-1/2 z-10 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm shadow-lg"
            >
              {toast.kind === "up" && <TrendingUp size={16} className="flex-none text-danger" aria-hidden />}
              {toast.kind === "down" && <TrendingDown size={16} className="flex-none text-success" aria-hidden />}
              {toast.kind === "error" && <CircleAlert size={16} className="flex-none text-danger" aria-hidden />}
              <span className="truncate">{toast.text}</span>
            </div>
          )}

          <div ref={logRef} role="log" aria-live="off" aria-label={`Conversation with ${persona.name}`} className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
            <div className="mx-auto flex max-w-[720px] flex-col gap-5">
              {messages.map((msg) =>
                msg.role === "system" ? (
                  <SystemDivider key={msg.key}>{msg.content}</SystemDivider>
                ) : msg.role === "persona" ? (
                  <PersonaBubble key={msg.key} persona={persona} time={msg.time}>
                    {msg.content}
                  </PersonaBubble>
                ) : (
                  <UserBubble key={msg.key} time={msg.time}>
                    {msg.content}
                  </UserBubble>
                ),
              )}
              {streaming !== null &&
                (streaming === "" ? (
                  <TypingBubble persona={persona} />
                ) : (
                  <div aria-hidden>
                    <PersonaBubble persona={persona} time={fmtClock(elapsed)}>
                      {streaming}
                    </PersonaBubble>
                  </div>
                ))}
            </div>
          </div>
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {announce}
          </div>

          <div className="flex-none border-t border-border bg-surface px-4 pt-3 pb-4 lg:px-6">
            <div className="mx-auto flex max-w-[720px] flex-col gap-2">
              {error && (
                <div role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-tint px-3 py-2.5 text-sm text-danger">
                  <CircleAlert size={16} className="mt-0.5 flex-none" aria-hidden />
                  <span className="flex-1">{error} Your message is back in the box below.</span>
                  <button type="button" onClick={() => setError(null)} aria-label="Dismiss error" className="rounded-sm bg-transparent p-0 text-danger">
                    <X size={16} aria-hidden />
                  </button>
                </div>
              )}
              {hint && (
                <div role="status" className="flex items-start gap-2.5 rounded-md bg-warning-tint px-3 py-2.5 text-sm text-ink">
                  <Lightbulb size={16} className="mt-0.5 flex-none text-warning-ink" aria-hidden />
                  <span className="flex-1">{hint}</span>
                  <button type="button" onClick={() => setHint(null)} aria-label="Dismiss hint" className="rounded-sm bg-transparent p-0 text-muted">
                    <X size={16} aria-hidden />
                  </button>
                </div>
              )}
              {ended ? (
                <div role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-subtle px-4 py-3 text-sm">
                  <span className="flex-1">The conversation has ended. Sending the transcript to your coach…</span>
                  <button
                    type="button"
                    onClick={() => void finish()}
                    disabled={!live}
                    className="h-9 rounded-md bg-primary px-3.5 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
                  >
                    Get feedback now
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-2 rounded-lg border border-border-strong bg-surface py-1.5 pr-1.5 pl-3.5 transition-colors duration-150 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    aria-label={`Your reply to ${first}`}
                    placeholder={pending ? `${first} is typing…` : `Reply to ${first}…`}
                    disabled={!live}
                    readOnly={pending}
                    aria-disabled={pending || undefined}
                    className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none border-0 bg-transparent py-1.5 text-base leading-normal text-ink placeholder:text-faint focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    title="Voice mode arrives in phase 2"
                    aria-label="Voice mode, coming soon"
                    className="flex h-9 w-9 flex-none cursor-not-allowed items-center justify-center rounded-md bg-transparent text-faint"
                  >
                    <Mic size={18} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={!canSend}
                    aria-label="Send"
                    className={`flex h-9 w-9 flex-none items-center justify-center rounded-md text-on-primary transition-colors duration-150 ${
                      canSend ? "bg-primary hover:bg-primary-hover" : "cursor-not-allowed bg-faint"
                    }`}
                  >
                    <ArrowUp size={18} strokeWidth={2} aria-hidden />
                  </button>
                </div>
              )}
              <p className="m-0 hidden text-xs text-muted lg:block">
                Enter to send · Shift+Enter for a new line · Esc to exit. The coach stays silent until the session ends.
              </p>
            </div>
          </div>
        </section>

        <aside id="sim-signals" aria-label="Live signals" className={`${sheetClass("signals")} lg:border-l lg:border-border`}>
          {sheetHeader("Signals", signalsCloseRef)}
          <SignalsPanel persona={persona} mood={mood} turn={userTurns} maxTurns={scenario.maxTurns} objectives={objectives} />
        </aside>
      </div>

      {sheet && <div aria-hidden onClick={() => setSheet(null)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />}

      {exitOpen && <ExitDialog onCancel={() => setExitOpen(false)} onLeave={leave} leaving={leaving} />}

      {phase === "reviewing" && <ReviewingOverlay targetLevel={initial.attempt.targetLevel} />}
    </div>
  );
}

function initialMessages(view: SimulationView, personaName: string): Msg[] {
  const out: Msg[] = [{ key: "start", role: "system", content: `Session started · ${personaName} has joined` }];
  for (const t of view.messages) {
    out.push({ key: `${t.role[0]}-${t.turn}`, role: t.role, content: t.content, turn: t.turn, time: t.turn === 0 ? "00:00" : undefined });
  }
  if (view.attempt.retryFromTurn != null && view.messages.length > 0) {
    out.push({ key: "retry", role: "system", content: `Retrying from turn ${view.attempt.retryFromTurn} · try it differently this time` });
  }
  return out;
}
