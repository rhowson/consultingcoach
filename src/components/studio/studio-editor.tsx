"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, ChevronRight, Clock, FolderOpen, Loader2, MessageSquare, Monitor, X } from "lucide-react";
import { api, ApiError, type Storyboard } from "@/lib/client/api";
import type { GhostSlide, PyramidNode, StudioComment } from "@/lib/types";
import { LEVEL_LABELS } from "@/lib/competency";
import { buttonClass } from "@/components/ui/button";
import { CasePack } from "./case-pack";
import { CoachPanel, type CommentView } from "./coach-panel";
import { GhostDeck } from "./ghost-deck";
import { STAGES, STAGE_HINTS, TIPS, emptyPyramid, focusField, inPyramid, setNodeText, stageComments, targetLabel, type Stage } from "./model";
import { PyramidEditor } from "./pyramid-editor";
import { Checklist, ReadOnlyStoryboard, TitleReadThrough, checklist } from "./review-stage";
import { ConfirmDialog, HintBanner, HintButton, SessionHeader, Shimmer, TargetPill, fmtClock } from "./session-header";
import { useMedia } from "./use-media";

type SaveState = "saved" | "pending" | "saving" | "error";
type Patch = { stage?: Stage; pyramid?: PyramidNode; slides?: GhostSlide[] };
const AUTOSAVE_MS = 800;

const errMessage = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

export function StudioEditor({ storyboard: sb }: { storyboard: Storyboard }) {
  const router = useRouter();
  const media = useMedia("(min-width: 1024px)");
  const desktop = media !== false;
  const pack = sb.case.casePack!;

  const [pyramid, setPyramid] = useState<PyramidNode>(sb.pyramid ?? emptyPyramid());
  const [slides, setSlides] = useState<GhostSlide[]>(sb.slides);
  const [stage, setStageState] = useState<Stage>(sb.stage);
  const [comments, setComments] = useState<StudioComment[]>(sb.comments);

  // Autosave plumbing: edits merge into `pending`, flushed after a quiet period.
  const [save, setSave] = useState<{ state: SaveState; error?: string }>({ state: "saved" });
  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef<Promise<boolean> | null>(null);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (inflight.current) await inflight.current;
    const patch = pending.current;
    if (!Object.keys(patch).length) return true;
    pending.current = {};
    setSave({ state: "saving" });
    const run = api.studio
      .save(sb.id, patch)
      .then(() => {
        setSave(Object.keys(pending.current).length ? { state: "pending" } : { state: "saved" });
        return true;
      })
      .catch((e: unknown) => {
        pending.current = { ...patch, ...pending.current };
        if (e instanceof ApiError && e.code === "submitted") router.refresh();
        setSave({ state: "error", error: errMessage(e, "Couldn't save your changes") });
        return false;
      })
      .finally(() => {
        inflight.current = null;
      });
    inflight.current = run;
    return run;
  }, [sb.id, router]);

  const queue = useCallback(
    (patch: Patch) => {
      Object.assign(pending.current, patch);
      setSave({ state: "pending" });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [flush],
  );

  const updatePyramid = (next: PyramidNode) => {
    setPyramid(next);
    queue({ pyramid: next });
  };
  const updateSlides = (next: GhostSlide[]) => {
    setSlides(next);
    queue({ slides: next });
  };
  const setStage = (next: Stage) => {
    setStageState(next);
    setHint(null);
    queue({ stage: next });
  };

  // Warn before closing the tab with unsaved edits.
  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length || inflight.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  // Session timer.
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"edit" | "submitting">("edit");
  useEffect(() => {
    if (phase !== "edit") return;
    const iv = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // Hints: static per stage, two per session.
  const [hintsLeft, setHintsLeft] = useState(2);
  const [hint, setHint] = useState<string | null>(null);
  const takeHint = () => {
    if (hintsLeft <= 0) return;
    setHint(STAGE_HINTS[stage][(2 - hintsLeft) % STAGE_HINTS[stage].length]);
    setHintsLeft(hintsLeft - 1);
  };

  // Coach.
  const [coachOpen, setCoachOpen] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tip, setTip] = useState(0);
  useEffect(() => {
    if (!reviewing && phase !== "submitting") return;
    const iv = setInterval(() => setTip((t) => (t + 1) % TIPS.length), 1800);
    return () => clearInterval(iv);
  }, [reviewing, phase]);

  async function askReview() {
    setReviewErr(null);
    setReviewing(true);
    try {
      if (!(await flush())) throw new Error("save");
      const { storyboard } = await api.studio.review(sb.id);
      setComments(storyboard.comments);
      setCoachOpen(true);
    } catch (e) {
      setReviewErr(errMessage(e, "The coach couldn't review this right now. Try again in a moment."));
    } finally {
      setReviewing(false);
    }
  }

  async function resolve(id: string) {
    setBusyId(id);
    const before = comments;
    setComments((cs) => cs.map((c) => (c.id === id ? { ...c, resolved: true } : c)));
    try {
      const { storyboard } = await api.studio.resolveComment(sb.id, id, true);
      setComments(storyboard.comments);
    } catch (e) {
      setComments(before);
      setReviewErr(errMessage(e, "Couldn't resolve that comment."));
    } finally {
      setBusyId(null);
    }
  }

  function apply(c: StudioComment) {
    if (!c.suggestion) return;
    if (inPyramid(pyramid, c.targetId)) updatePyramid(setNodeText(pyramid, c.targetId, c.suggestion));
    else updateSlides(slides.map((s) => (s.id === c.targetId ? { ...s, actionTitle: c.suggestion! } : s)));
    void resolve(c.id);
  }

  const { list: openList, pins } = useMemo(() => stageComments(stage, comments, pyramid, slides), [stage, comments, pyramid, slides]);
  const resolvedCount = useMemo(
    () => stageComments(stage, comments.filter((c) => c.resolved).map((c) => ({ ...c, resolved: false })), pyramid, slides).list.length,
    [stage, comments, pyramid, slides],
  );
  const commentViews: CommentView[] = openList.map((c, i) => {
    const target = targetLabel(pyramid, slides, c.targetId);
    return {
      comment: c,
      pin: i + 1,
      target: target ?? "General",
      onApply: c.suggestion && target && desktop ? () => apply(c) : undefined,
    };
  });

  function focusTarget(targetId: string) {
    if (inPyramid(pyramid, targetId) && stage !== "pyramid") setStage("pyramid");
    else if (slides.some((s) => s.id === targetId) && stage === "pyramid") setStage("ghost_deck");
    focusField(targetId);
  }

  // Exit / submit.
  const [exitOpen, setExitOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || phase !== "edit") return;
      if (confirmSubmit) setConfirmSubmit(false);
      else setExitOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, confirmSubmit]);

  async function leave() {
    setLeaving(true);
    await flush();
    router.push("/studio");
  }

  async function submit() {
    setConfirmSubmit(false);
    setExitOpen(false);
    setSubmitErr(null);
    setPhase("submitting");
    try {
      if (!(await flush())) throw new Error("save");
      const report = await api.studio.submit(sb.id);
      router.push(`/feedback/${report.attempt.id}`);
    } catch (e) {
      setPhase("edit");
      setSubmitErr(errMessage(e, "Scoring failed. Your work is saved; try submitting again."));
    }
  }

  const [packOpen, setPackOpen] = useState(false);
  const stageIdx = STAGES.findIndex((s) => s.key === stage);
  const items = checklist(pyramid, slides, comments);
  const gutter = "px-4 md:px-8";

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-bg">
      <SessionHeader title={sb.case.title} subtitle={`Storyboard Studio · ${pack.client}`} onExit={() => setExitOpen(true)}>
        <span aria-label="Time elapsed" className="tabular hidden items-center gap-1.5 text-sm whitespace-nowrap text-ink-2 md:flex">
          <Clock size={16} className="text-muted" aria-hidden />
          {fmtClock(elapsed)}
          <span className="text-muted">/ {fmtClock(sb.case.durationMin * 60)}</span>
        </span>
        <TargetPill level={sb.case.targetLevel} />
        <HintButton left={hintsLeft} onClick={takeHint} />
        <button type="button" onClick={() => setConfirmSubmit(true)} className={buttonClass("primary", "md")}>
          Submit
        </button>
      </SessionHeader>

      {media === null ? (
        <div className="flex-1" aria-busy="true" />
      ) : (
      <div className={`flex min-h-0 flex-1 ${desktop ? "flex-row overflow-hidden" : "flex-col overflow-y-auto"}`}>
        {desktop && (
          <div className="hidden min-h-0 min-[1180px]:flex">
            <CasePack sb={sb} />
          </div>
        )}

        <main className={`flex min-w-0 flex-col ${desktop ? "min-h-0 flex-1" : "flex-none"}`}>
          {desktop && (
            <div className={`flex flex-none items-center gap-2 overflow-x-auto border-b border-border bg-bg py-3 ${gutter}`}>
              <nav aria-label="Stages" className="flex items-center gap-1">
                {STAGES.map((st, i) => {
                  const current = st.key === stage;
                  return (
                    <Fragment key={st.key}>
                      <button
                        type="button"
                        onClick={() => setStage(st.key)}
                        aria-current={current ? "step" : undefined}
                        className={`flex h-9 items-center gap-2 rounded-full pr-3 pl-1.5 text-sm whitespace-nowrap text-ink ${
                          current ? "bg-surface font-semibold" : "font-medium hover:bg-hover"
                        }`}
                      >
                        <span
                          className={`tabular flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            current ? "bg-primary text-on-primary" : i < stageIdx ? "bg-success-tint text-success" : "bg-border text-ink-2"
                          }`}
                        >
                          {i < stageIdx ? <Check size={13} strokeWidth={2.5} aria-label="Done" /> : i + 1}
                        </span>
                        {st.label}
                      </button>
                      {i < STAGES.length - 1 && <ChevronRight size={16} className="flex-none text-faint" aria-hidden />}
                    </Fragment>
                  );
                })}
              </nav>
              <div className="flex-1" />
              <SaveStatus save={save} onRetry={() => void flush()} />
              <button
                type="button"
                onClick={() => setPackOpen(true)}
                className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[13px] font-medium whitespace-nowrap text-ink hover:bg-hover min-[1180px]:hidden"
              >
                <FolderOpen size={16} aria-hidden />
                Case pack
              </button>
              {!coachOpen && (
                <button
                  type="button"
                  onClick={() => setCoachOpen(true)}
                  aria-label={`Open coach panel, ${openList.length} open comments`}
                  className="flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-[13px] font-medium whitespace-nowrap text-ink hover:bg-hover"
                >
                  <MessageSquare size={16} aria-hidden />
                  Coach
                  {openList.length > 0 && <span className="tabular text-muted">{openList.length}</span>}
                </button>
              )}
            </div>
          )}

          <div className={`${desktop ? "flex-1 overflow-auto" : ""} pt-6 pb-12 ${gutter}`}>
            {!desktop && (
              <div role="note" className="mb-5 flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm">
                <Monitor size={18} className="mt-0.5 flex-none text-primary" aria-hidden />
                <span className="flex-1">
                  The pyramid and deck editor work best on a tablet or desktop. You&apos;re in read-and-comment mode.{" "}
                  <button type="button" onClick={() => setPackOpen(true)} className="font-semibold text-primary underline-offset-2 hover:underline">
                    Open case pack
                  </button>
                </span>
              </div>
            )}
            {submitErr && (
              <div role="alert" className="mx-auto mb-5 flex max-w-[960px] items-start gap-2.5 rounded-md bg-danger-tint px-3 py-2.5 text-sm text-danger">
                <AlertCircle size={16} className="mt-0.5 flex-none" aria-hidden />
                <span className="flex-1">{submitErr}</span>
                <button type="button" onClick={() => setSubmitErr(null)} aria-label="Dismiss error">
                  <X size={16} aria-hidden />
                </button>
              </div>
            )}
            {hint && <HintBanner text={hint} onDismiss={() => setHint(null)} className="mx-auto mb-5 max-w-[960px]" />}

            {!desktop ? (
              <ReadOnlyStoryboard pyramid={pyramid} slides={slides} exhibits={pack.exhibits} />
            ) : stage === "pyramid" ? (
              <PyramidEditor pyramid={pyramid} onChange={updatePyramid} pins={pins} />
            ) : stage === "ghost_deck" ? (
              <GhostDeck slides={slides} exhibits={pack.exhibits} pyramid={pyramid} onChange={updateSlides} pins={pins} />
            ) : (
              <div className="mx-auto flex max-w-[760px] flex-col gap-6">
                <div className="flex flex-col gap-1">
                  <h2 className="eyebrow m-0">Title read-through</h2>
                  <p className="m-0 text-sm text-muted">What the CEO reads if she only reads the titles. It should hold together as an argument.</p>
                </div>
                <TitleReadThrough slides={slides} />
                <section aria-labelledby="chk-title" className="flex flex-col gap-3.5 rounded-lg border border-border bg-surface p-6">
                  <h3 id="chk-title" className="eyebrow m-0">
                    Before you submit
                  </h3>
                  <Checklist items={items} />
                </section>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => setStage("ghost_deck")} className={buttonClass("secondary", "lg")}>
                    Edit ghost deck
                  </button>
                  <button type="button" onClick={() => setConfirmSubmit(true)} className={buttonClass("primary", "lg")}>
                    Submit for feedback
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {(!desktop || coachOpen) && (
          <CoachPanel
            className={desktop ? "w-[340px] border-l border-border" : "border-t border-border"}
            comments={commentViews}
            resolvedCount={resolvedCount}
            reviewed={comments.length > 0}
            reviewing={reviewing}
            tip={TIPS[tip]}
            error={reviewErr}
            busyId={busyId}
            onAsk={() => void askReview()}
            onResolve={(id) => void resolve(id)}
            onFocusTarget={focusTarget}
            onCollapse={desktop ? () => setCoachOpen(false) : undefined}
          />
        )}
      </div>
      )}

      {packOpen && (
        <div className="fixed inset-0 z-40 flex bg-ink/30 min-[1180px]:hidden" onClick={() => setPackOpen(false)}>
          <div className="relative flex max-w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CasePack sb={sb} />
            <button
              type="button"
              autoFocus
              onClick={() => setPackOpen(false)}
              aria-label="Close case pack"
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>
      )}

      {exitOpen && (
        <ConfirmDialog
          title="Leave the studio?"
          body="Your pyramid and ghost deck are saved as a draft. Nothing is scored until you submit."
          cancelLabel="Keep working"
          onCancel={() => setExitOpen(false)}
        >
          <button type="button" onClick={() => void leave()} disabled={leaving} className={buttonClass("primary", "md", "h-10 px-4")}>
            {leaving ? "Saving…" : "Save and leave"}
          </button>
        </ConfirmDialog>
      )}

      {confirmSubmit && (
        <ConfirmDialog
          title="Submit for feedback?"
          body={
            <div className="flex flex-col gap-3">
              <p className="m-0">The coach scores your pyramid and ghost deck against the {LEVEL_LABELS[sb.case.targetLevel]} bar. You can&apos;t edit this storyboard after submitting.</p>
              {items.some((i) => !i.ok) && (
                <p className="m-0 flex items-start gap-2 rounded-md bg-warning-tint px-3 py-2 text-warning-ink">
                  <AlertCircle size={16} className="mt-0.5 flex-none" aria-hidden />
                  {items.filter((i) => !i.ok).length} checklist item{items.filter((i) => !i.ok).length === 1 ? "" : "s"} still open.
                </p>
              )}
            </div>
          }
          cancelLabel="Keep editing"
          onCancel={() => setConfirmSubmit(false)}
        >
          <button type="button" onClick={() => void submit()} className={buttonClass("primary", "md", "h-10 px-4")}>
            Submit
          </button>
        </ConfirmDialog>
      )}

      {phase === "submitting" && (
        <div role="status" className="absolute inset-0 z-50 flex items-center justify-center bg-bg p-6">
          <div className="flex w-full max-w-[440px] flex-col items-center gap-5 text-center">
            <span className="font-serif text-2xl font-semibold">Coach is scoring…</span>
            <Shimmer center />
            <span className="min-h-[42px] text-sm text-muted">{TIPS[tip]}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveStatus({ save, onRetry }: { save: { state: SaveState; error?: string }; onRetry: () => void }) {
  if (save.state === "error") {
    return (
      <span role="alert" className="flex items-center gap-1.5 text-[13px] whitespace-nowrap text-danger">
        <AlertCircle size={14} aria-hidden />
        {save.error ?? "Couldn't save"}
        <button type="button" onClick={onRetry} className="font-semibold underline underline-offset-2">
          Retry
        </button>
      </span>
    );
  }
  const saving = save.state !== "saved";
  return (
    <span aria-live="polite" className="flex items-center gap-1.5 text-[13px] whitespace-nowrap text-muted">
      {saving ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Check size={14} className="text-success" aria-hidden />}
      {saving ? "Saving…" : "Saved"}
    </span>
  );
}

/** Submitted storyboards are read-only, with links onwards. */
export function SubmittedStoryboard({ storyboard: sb }: { storyboard: Storyboard }) {
  const router = useRouter();
  const pack = sb.case.casePack!;
  const pyramid = sb.pyramid ?? emptyPyramid();
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <SessionHeader title={sb.case.title} subtitle={`Storyboard Studio · ${pack.client} · Submitted`} onExit={() => router.push("/studio")}>
        <TargetPill level={sb.case.targetLevel} />
        <span className="hidden sm:flex">
          <Link href={`/rehearsal/${sb.id}`} className={buttonClass("secondary", "md")}>
            Rehearse this deck
          </Link>
        </span>
        <Link href={`/feedback/${sb.attemptId}`} className={buttonClass("primary", "md")}>
          <span className="sm:hidden">Feedback</span>
          <span className="hidden sm:inline">View feedback</span>
        </Link>
      </SessionHeader>
      <div className="flex min-h-0 flex-1">
        <div className="hidden min-h-0 min-[1180px]:flex">
          <CasePack sb={sb} />
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pt-6 pb-12 md:px-8">
          <div role="note" className="mx-auto mb-6 flex max-w-[960px] flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
            <Check size={18} className="flex-none text-success" aria-hidden />
            <span className="min-w-[200px] flex-1">This storyboard has been submitted and scored. It&apos;s read-only now.</span>
            <Link href={`/feedback/${sb.attemptId}`} className="font-semibold text-primary hover:underline">
              See your feedback
            </Link>
            <Link href={`/rehearsal/${sb.id}`} className="font-semibold text-primary hover:underline">
              Rehearse at SteerCo
            </Link>
          </div>
          <div className="mx-auto mb-8 flex max-w-[960px] flex-col gap-2">
            <h2 className="eyebrow m-0">Title read-through</h2>
            <TitleReadThrough slides={sb.slides} />
          </div>
          <ReadOnlyStoryboard pyramid={pyramid} slides={sb.slides} exhibits={pack.exhibits} />
        </main>
      </div>
    </div>
  );
}
