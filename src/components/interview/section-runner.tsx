"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlarmClock, Check, CircleAlert, Clock, CloudOff, Eye, Info, Send } from "lucide-react";
import {
  fmtCountdown,
  fmtTime,
  toApiError,
  type CandidateView,
  type InterviewApi,
  type PackSection,
  type SectionStateView,
  type TelemetryEvent,
} from "./client";
import { useCountdown } from "./hooks";
import { AnswerField } from "./answer-field";
import { AssistantPanel } from "./assistant-panel";
import { CasePackPanel } from "./case-pack";
import { ConversationPanel } from "./conversation";
import { InterviewStyles, SectionStepper, SmallScreenNotice, Spinner } from "./shell";

type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: string } | { kind: "error" };
type Phase = "live" | "submitting" | "timeup";

const AUTOSAVE_MS = 2000;

export function SectionRunner({
  view,
  section,
  state,
  api,
  track,
  onView,
  onReload,
}: {
  view: CandidateView;
  section: PackSection;
  state: SectionStateView;
  api: InterviewApi;
  track: (ev: TelemetryEvent, urgent?: boolean) => void;
  onView: (v: CandidateView) => void;
  onReload: () => Promise<void>;
}) {
  const index = view.pack.sections.findIndex((s) => s.id === section.id);
  const total = view.pack.sections.length;
  const hasAnswers = section.questions.length > 0;

  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(section.questions.map((q) => [q.id, state.answers[q.id] ?? ""])),
  );
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [phase, setPhase] = useState<Phase>("live");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const answersRef = useRef(answers);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const phaseRef = useRef<Phase>("live");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const awayToastShown = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);

  // Latest-callback refs so timers always call the current version.
  const saveNowRef = useRef<() => Promise<void>>(async () => {});
  const submitRef = useRef<(auto: boolean, attempt?: number) => Promise<void>>(async () => {});

  // ---------- Autosave ----------
  const saveNow = useCallback(async () => {
    clearTimeout(saveTimer.current);
    if (!hasAnswers || !dirtyRef.current || phaseRef.current !== "live") return;
    if (savingRef.current) {
      // Another save is in flight; try again once it's done.
      saveTimer.current = setTimeout(() => void saveNowRef.current(), 500);
      return;
    }
    savingRef.current = true;
    dirtyRef.current = false;
    setSave({ kind: "saving" });
    try {
      const r = await api.save(section.id, answersRef.current);
      setSave({ kind: "saved", at: r.savedAt });
    } catch (e) {
      dirtyRef.current = true;
      const err = toApiError(e);
      if (err.status === 409) {
        // Time's up or the section was closed elsewhere: the server is the source of truth.
        phaseRef.current = "submitting";
        void onReload();
        return;
      }
      setSave({ kind: "error" });
      saveTimer.current = setTimeout(() => void saveNowRef.current(), 5000);
    } finally {
      savingRef.current = false;
    }
  }, [api, hasAnswers, onReload, section.id]);
  useEffect(() => {
    saveNowRef.current = saveNow;
  }, [saveNow]);

  function updateAnswer(id: string, value: string) {
    const next = { ...answersRef.current, [id]: value };
    answersRef.current = next;
    setAnswers(next);
    dirtyRef.current = true;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void saveNowRef.current(), AUTOSAVE_MS);
  }

  // ---------- Submit (manual or at 0:00) ----------
  const submit = useCallback(
    async (auto: boolean, attempt = 0) => {
      if (phaseRef.current !== "live" && attempt === 0) return;
      phaseRef.current = auto ? "timeup" : "submitting";
      setPhase(phaseRef.current);
      setConfirmOpen(false);
      setSubmitError(null);
      clearTimeout(saveTimer.current);
      try {
        onView(await api.submit(section.id, answersRef.current));
      } catch (e) {
        const err = toApiError(e);
        if (err.status === 409 || err.status === 404 || err.status === 410) {
          await onReload();
          return;
        }
        if (auto) {
          if (attempt < 4) {
            retryTimer.current = setTimeout(() => void submitRef.current(true, attempt + 1), 3000);
          } else {
            await onReload();
          }
          return;
        }
        phaseRef.current = "live";
        setPhase("live");
        setSubmitError(`${err.message} Your answers are still here — try submitting again.`);
      }
    },
    [api, onReload, onView, section.id],
  );
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  const onExpire = useCallback(() => void submitRef.current(true), []);
  const { secondsLeft, announcement } = useCountdown(state.deadline, view.serverNow, onExpire);

  // ---------- Integrity signals ----------
  const onPaste = useCallback(
    (field: string) => (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const chars = e.clipboardData.getData("text").length;
      track({ type: "paste", sectionId: section.id, meta: { chars, field } });
    },
    [section.id, track],
  );

  const showToast = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  }, []);

  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        track({ type: "tab_hidden", sectionId: section.id }, true);
        if (dirtyRef.current && hasAnswers && phaseRef.current === "live") api.saveKeepalive(section.id, answersRef.current);
      } else if (hiddenAt != null) {
        const awayMs = Date.now() - hiddenAt;
        hiddenAt = null;
        track({ type: "tab_visible", sectionId: section.id, meta: { awayMs } }, true);
        if (!awayToastShown.current) {
          awayToastShown.current = true;
          showToast("Time away from the exercise is recorded.");
        }
      }
    };
    const onPageHide = () => {
      if (dirtyRef.current && hasAnswers && phaseRef.current === "live") api.saveKeepalive(section.id, answersRef.current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [api, hasAnswers, section.id, showToast, track]);

  // Focus the section heading when a section opens; clear timers on the way out.
  useEffect(() => {
    headingRef.current?.focus();
    return () => {
      clearTimeout(saveTimer.current);
      clearTimeout(retryTimer.current);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const casePanel = view.casePack && (
    <CasePackPanel casePack={view.casePack} onCopyBlocked={(tab) => track({ type: "copy_blocked", sectionId: section.id, meta: { field: tab } })} />
  );
  const live = phase === "live";

  const sectionBar = (
    <div className="flex flex-none flex-col gap-2 border-b border-border bg-surface px-4 py-3 lg:px-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="eyebrow">
            Section {index + 1} of {total}
          </span>
          <h2 ref={headingRef} tabIndex={-1} className="m-0 font-serif text-xl font-semibold focus-visible:outline-none">
            {section.title}
          </h2>
        </div>
        {hasAnswers && <SaveStatus save={save} />}
        <button
          ref={submitBtnRef}
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!live}
          className="inline-flex h-9 flex-none items-center gap-2 rounded-md bg-primary px-3.5 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {phase === "submitting" ? <Spinner /> : <Send size={15} aria-hidden />}
          {index + 1 === total ? "Submit and finish" : "Submit section"}
        </button>
      </div>
      <details className="group text-sm">
        <summary className="inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-[13px] font-medium text-muted hover:text-ink">
          <Info size={14} aria-hidden />
          Instructions
        </summary>
        <ul className="m-0 mt-2 flex flex-col gap-1.5 pl-5 text-ink-2">
          {section.instructions.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </details>
      {submitError && (
        <div role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-tint px-3 py-2.5 text-sm text-danger">
          <CircleAlert size={16} className="mt-0.5 flex-none" aria-hidden />
          <span>{submitError}</span>
        </div>
      )}
    </div>
  );

  const asideBase = "flex flex-col border-b border-border bg-surface max-lg:max-h-[60dvh] lg:min-h-0 lg:flex-none lg:border-r lg:border-b-0";

  let body: React.ReactNode;
  if (section.kind === "ai_analysis") {
    const q = section.questions[0];
    body = (
      <>
        <aside aria-label="Case pack" className={`${asideBase} lg:w-[320px] xl:w-[360px]`}>
          {casePanel}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col lg:min-h-0">
          {sectionBar}
          <div className="flex flex-1 flex-col gap-4 px-4 py-5 lg:min-h-0 lg:overflow-y-auto lg:px-6">
            {q && (
              <AnswerField
                question={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => updateAnswer(q.id, v)}
                onBlur={() => void saveNow()}
                onPaste={onPaste(q.id)}
                disabled={!live}
                tall
              />
            )}
          </div>
        </main>
        <aside aria-label="AI assistant" className="flex flex-col border-t border-border bg-surface max-lg:h-[70dvh] lg:min-h-0 lg:w-[360px] lg:flex-none lg:border-t-0 lg:border-l xl:w-[400px]">
          <AssistantPanel
            api={api}
            preRead={view.aiPreRead}
            log={view.assistantLog}
            promptsLeft={view.assistantPromptsLeft}
            live={live}
            onPaste={onPaste("assistant")}
          />
        </aside>
      </>
    );
  } else if (section.kind === "client_conversation") {
    body = (
      <>
        <aside aria-label="Case pack" className={`${asideBase} lg:w-[360px] xl:w-[400px]`}>
          {casePanel}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col max-lg:min-h-[80dvh] lg:min-h-0">
          {sectionBar}
          <ConversationPanel
            key={view.conversation.length}
            api={api}
            persona={view.persona}
            conversation={view.conversation}
            maxTurns={section.maxTurns ?? 8}
            live={live}
            onPaste={onPaste("client")}
            onReload={() => void onReload()}
          />
        </main>
      </>
    );
  } else {
    body = (
      <>
        <aside aria-label="Case pack" className={`${asideBase} lg:w-[42%] lg:max-w-[560px]`}>
          {casePanel}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col lg:min-h-0">
          {sectionBar}
          <div className="flex-1 px-4 py-6 lg:min-h-0 lg:overflow-y-auto lg:px-8">
            <div className="mx-auto flex max-w-[760px] flex-col gap-8">
              {section.questions.map((q, i) => (
                <AnswerField
                  key={q.id}
                  question={q}
                  number={section.questions.length > 1 ? i + 1 : undefined}
                  value={answers[q.id] ?? ""}
                  onChange={(v) => updateAnswer(q.id, v)}
                  onBlur={() => void saveNow()}
                  onPaste={onPaste(q.id)}
                  disabled={!live}
                />
              ))}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={!live}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-semibold text-ink hover:bg-hover disabled:opacity-50"
                >
                  <Send size={15} aria-hidden />
                  {index + 1 === total ? "Submit and finish" : "Submit section"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-bg lg:h-dvh lg:overflow-hidden">
      <InterviewStyles />
      <header className="flex h-[60px] flex-none items-center gap-3 border-b border-border bg-surface px-4 lg:px-6">
        <h1 className="sr-only m-0 min-w-0 truncate font-serif md:not-sr-only text-[17px] font-semibold md:block md:max-w-[260px] xl:max-w-[380px]">{view.pack.title}</h1>
        <span className="hidden h-6 w-px flex-none bg-border md:block" aria-hidden />
        <SectionStepper sections={view.pack.sections} states={view.sections} currentId={section.id} />
        <div className="flex-1" />
        <Countdown secondsLeft={secondsLeft} />
      </header>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {announcement}
      </div>
      <SmallScreenNotice />

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">{body}</div>

      {toast && (
        <div
          role="status"
          className="iv-toast fixed top-[72px] left-1/2 z-40 flex max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-sm shadow-lg"
        >
          <Eye size={15} className="flex-none text-muted" aria-hidden />
          <span>{toast}</span>
        </div>
      )}

      {confirmOpen && (
        <ConfirmSubmit
          last={index + 1 === total}
          onCancel={() => {
            setConfirmOpen(false);
            requestAnimationFrame(() => submitBtnRef.current?.focus());
          }}
          onConfirm={() => void submit(false)}
        />
      )}

      {phase === "timeup" && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="iv-timeup" className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 p-6">
          <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-tint text-danger">
              <AlarmClock size={22} aria-hidden />
            </span>
            <h2 id="iv-timeup" className="m-0 font-serif text-2xl font-semibold">
              Time&apos;s up
            </h2>
            <p className="m-0 flex items-center gap-2 text-ink-2">
              <Spinner />
              Submitting your answers…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Countdown({ secondsLeft }: { secondsLeft: number }) {
  const danger = secondsLeft <= 60;
  const warn = !danger && secondsLeft <= 300;
  const cls = danger ? "border-danger bg-danger-tint text-danger" : warn ? "border-warning bg-warning-tint text-warning-ink" : "border-border bg-surface text-ink";
  const Icon = danger || warn ? AlarmClock : Clock;
  const mins = Math.ceil(secondsLeft / 60);
  return (
    <div
      role="timer"
      aria-label={`Time left in this section: ${mins <= 1 ? "under a minute" : `${mins} minutes`}`}
      className={`flex flex-none items-center gap-2 rounded-lg border px-3 py-1.5 ${cls}`}
    >
      <Icon size={18} aria-hidden />
      <span aria-hidden className="tabular text-xl leading-none font-semibold">
        {fmtCountdown(secondsLeft)}
      </span>
      <span aria-hidden className="hidden text-xs font-semibold sm:inline">
        {danger ? "Final minute" : warn ? "Under 5 min" : "left"}
      </span>
    </div>
  );
}

function SaveStatus({ save }: { save: SaveState }) {
  return (
    <span role="status" className="flex flex-none items-center gap-1.5 text-[13px] text-muted">
      {save.kind === "saving" && (
        <>
          <Spinner size={13} />
          Saving…
        </>
      )}
      {save.kind === "saved" && (
        <>
          <Check size={14} className="text-success" aria-hidden />
          <span className="tabular">Saved {fmtTime(save.at)}</span>
        </>
      )}
      {save.kind === "error" && (
        <span className="flex items-center gap-1.5 text-warning-ink">
          <CloudOff size={14} aria-hidden />
          Not saved — retrying
        </span>
      )}
      {save.kind === "idle" && <span>Autosaves as you type</span>}
    </span>
  );
}

function ConfirmSubmit({ last, onCancel, onConfirm }: { last: boolean; onCancel: () => void; onConfirm: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      // Keep focus inside the dialog.
      if (e.key === "Tab") {
        const first = cancelRef.current;
        const lastEl = confirmRef.current;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden onClick={onCancel} className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="iv-confirm-title"
        aria-describedby="iv-confirm-body"
        className="relative flex w-full max-w-[440px] flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xl"
      >
        <h2 id="iv-confirm-title" className="m-0 font-serif text-xl font-semibold">
          {last ? "Submit and finish the exercise?" : "Submit this section?"}
        </h2>
        <p id="iv-confirm-body" className="m-0 text-[15px] text-ink-2">
          You can&apos;t come back to this section once it&apos;s submitted.
          {last ? " This is the last section, so your exercise will be complete." : " The next section won't start until you're ready."}
        </p>
        <div className="flex justify-end gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className="h-10 rounded-md border border-border bg-surface px-4 text-sm font-medium text-ink hover:bg-hover">
            Keep working
          </button>
          <button ref={confirmRef} type="button" onClick={onConfirm} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover">
            {last ? "Submit and finish" : "Submit section"}
          </button>
        </div>
      </div>
    </div>
  );
}
