import type { FeedbackMoment } from "@/lib/types";
import { RetrySimButton } from "./retry-button";

/** MomentCard: what you said, why it mattered, and what to try instead. */
export function MomentCard({
  moment,
  mode,
  scenarioId,
  attemptId,
}: {
  moment: FeedbackMoment;
  mode: "simulation" | "storyboard" | "rehearsal" | "diagnostic";
  scenarioId: string;
  attemptId: string;
}) {
  const turn = /^\d+$/.test(moment.ref.trim()) ? Number(moment.ref) : null;
  const canRetry = mode === "simulation" && turn != null;
  const where = mode === "simulation" || mode === "diagnostic" ? (turn != null ? `Turn ${turn} · You said` : "You said") : "In your storyboard";

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 md:p-6">
      <span className="tabular text-xs text-muted">{where}</span>
      <blockquote className="m-0 font-serif text-lg leading-snug font-semibold text-ink">“{moment.quote}”</blockquote>
      <p className="m-0 text-[15px] text-ink-2">{moment.annotation}</p>
      {moment.tryInstead && (
        <div className="flex flex-col gap-1 rounded-md bg-success-tint px-4 py-3.5">
          <span className="text-xs font-semibold tracking-[0.06em] text-success uppercase">Try instead</span>
          <span className="text-[15px] text-ink">“{moment.tryInstead}”</span>
        </div>
      )}
      {canRetry && (
        <div>
          <RetrySimButton scenarioId={scenarioId} retryOf={attemptId} fromTurn={turn}>
            Retry this moment
          </RetrySimButton>
        </div>
      )}
    </article>
  );
}
