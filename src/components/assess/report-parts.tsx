import { Bot, CircleAlert, CircleCheck, CircleMinus, CircleX, ShieldAlert, ShieldX, Timer, User } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import type { InterviewEvent, InterviewReport } from "./client";
import { GUARD_CATEGORY_LABELS, fmtTime } from "./meta";

type Result = NonNullable<InterviewReport["result"]>;
type Pack = InterviewReport["pack"];
type SectionState = InterviewReport["sections"][number];

/** The hiring bar on the 1–5 scale. */
export const MEETS_BAR = 4;

const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

// ---------------------------------------------------------------------
// Scores
// ---------------------------------------------------------------------

function band(score: number) {
  if (score >= MEETS_BAR) return { label: "Meets the bar", bar: "bg-success" };
  if (score >= 3) return { label: "Close to the bar", bar: "bg-warning" };
  return { label: "Below the bar", bar: "bg-danger" };
}

export function DimensionScore({ dim, first }: { dim: Result["dimensions"][number]; first: boolean }) {
  const b = band(dim.score);
  return (
    <div className={`flex flex-col gap-2.5 py-4 break-inside-avoid ${first ? "" : "border-t border-border"}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 flex-col">
          <span className="text-[15px] font-semibold">{dim.label}</span>
          <span className="text-xs text-muted">{b.label}</span>
        </span>
        <span className="tabular flex-none text-xl font-semibold">
          {dim.score.toFixed(1)}
          <span className="text-[13px] font-normal text-muted"> / 5</span>
        </span>
      </div>
      <div aria-hidden className="relative h-1.5 rounded-full bg-hover print:border print:border-border">
        <div className={`absolute inset-y-0 left-0 rounded-full ${b.bar}`} style={{ width: `${(Math.min(Math.max(dim.score, 0), 5) / 5) * 100}%` }} />
        <div className="absolute -top-[5px] -bottom-[5px] w-0.5 bg-accent" style={{ left: `${(MEETS_BAR / 5) * 100}%` }} />
      </div>
      <p className="m-0 text-sm text-ink-2">{dim.rationale}</p>
      {dim.evidence.length > 0 && (
        <ul aria-label={`Evidence for ${dim.label}`} className="m-0 flex list-none flex-col gap-1.5 p-0">
          {dim.evidence.map((q, i) => (
            <li key={i} className="border-l-2 border-border-strong pl-3 font-serif text-[15px] text-ink">
              “{q}”
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ScoresCard({ result }: { result: Result }) {
  return (
    <section aria-labelledby="scores-title" className="flex flex-col gap-3">
      <CardTitle id="scores-title">Scores</CardTitle>
      <Card className="px-5 pt-1 pb-4 md:px-6">
        {result.dimensions.map((d, i) => (
          <DimensionScore key={d.id} dim={d} first={i === 0} />
        ))}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span aria-hidden className="h-3 w-0.5 bg-accent" />
          Meets the bar at {MEETS_BAR.toFixed(1)} for the target level
        </div>
      </Card>
    </section>
  );
}

export function ListCard({ id, title, items, tone }: { id: string; title: string; items: string[]; tone: "success" | "warning" | "neutral" }) {
  if (!items.length) return null;
  const Icon = tone === "success" ? CircleCheck : tone === "warning" ? CircleMinus : null;
  const iconCls = tone === "success" ? "text-success" : "text-warning-ink";
  return (
    <Card aria-labelledby={id} className="flex flex-col gap-3 p-5 break-inside-avoid md:p-6">
      <h3 id={id} className="m-0 font-serif text-lg font-semibold">
        {title}
      </h3>
      {Icon ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {items.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-ink">
              <Icon size={16} className={`mt-0.5 flex-none ${iconCls}`} aria-hidden />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((s, i) => (
            <li key={i} className="flex gap-3 text-[15px] text-ink">
              <span aria-hidden className="tabular w-5 flex-none font-serif text-lg leading-tight font-semibold text-accent">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------
// AI use
// ---------------------------------------------------------------------

const PLANTED = {
  caught: { label: "Caught", cls: "bg-success-tint text-success", Icon: CircleCheck },
  partially: { label: "Partially caught", cls: "bg-warning-tint text-warning-ink", Icon: CircleMinus },
  missed: { label: "Missed", cls: "bg-danger-tint text-danger", Icon: CircleX },
} as const;

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md bg-subtle px-3.5 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="m-0 flex flex-col gap-0.5">
        <span className="tabular text-xl font-semibold text-ink">{value}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </dd>
    </div>
  );
}

const AI_TYPES = new Set(["assistant_prompt", "assistant_reply", "guardrail_block"]);

export function AiUsePanel({ pack, result, events }: { pack: Pack; result: Result | null; events: InterviewEvent[] }) {
  const log = events.filter((e) => AI_TYPES.has(e.type));
  const prompts = result?.metrics.assistantPrompts ?? log.filter((e) => e.type === "assistant_prompt").length;
  const blocks = result?.metrics.guardrailBlocks ?? log.filter((e) => e.type === "guardrail_block").length;
  const planted = result ? PLANTED[result.plantedError] : null;

  return (
    <section aria-labelledby="ai-title" className="flex flex-col gap-3">
      <CardTitle id="ai-title">AI use</CardTitle>
      <Card className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex flex-col gap-3 break-inside-avoid">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-[15px] font-semibold">Planted error in the AI pre-read</h3>
            {planted ? (
              <span className={`inline-flex items-center gap-1 rounded-full py-px pr-2 pl-1.5 text-xs font-semibold ${planted.cls}`}>
                <planted.Icon size={13} strokeWidth={2} aria-hidden />
                {planted.label}
              </span>
            ) : (
              <span className="text-xs text-muted">Not scored yet</span>
            )}
          </div>
          {result?.plantedErrorEvidence && <p className="m-0 text-sm text-ink-2">{result.plantedErrorEvidence}</p>}
          <div className="flex flex-col gap-2 rounded-md border border-border p-3.5 text-sm">
            <p className="m-0 text-ink-2">{pack.plantedError.description}</p>
            <dl className="m-0 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="flex flex-col gap-0.5">
                <dt className="flex items-center gap-1 text-xs font-semibold text-danger">
                  <CircleX size={13} aria-hidden /> Pre-read said
                </dt>
                <dd className="m-0 text-ink">{pack.plantedError.wrong}</dd>
              </div>
              <div className="flex flex-col gap-0.5">
                <dt className="flex items-center gap-1 text-xs font-semibold text-success">
                  <CircleCheck size={13} aria-hidden /> Correct
                </dt>
                <dd className="m-0 text-ink">{pack.plantedError.correct}</dd>
              </div>
            </dl>
          </div>
        </div>

        <dl className="m-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Assistant prompts" value={prompts} />
          <Stat label="Guardrail blocks" value={blocks} />
          <Stat
            label="Memo overlap with assistant"
            value={result ? `${result.metrics.memoOverlapWithAssistant}%` : "—"}
            hint="Share of memo phrases found in replies"
          />
          <Stat label="Memo length" value={result ? `${result.metrics.memoWords} words` : "—"} />
        </dl>

        <div className="flex flex-col gap-3">
          <h3 className="m-0 text-[15px] font-semibold">Assistant log</h3>
          {log.length === 0 ? (
            <p className="m-0 text-sm text-muted">The candidate didn&apos;t use the assistant.</p>
          ) : (
            <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
              {log.map((e) => (
                <AssistantLogItem key={e.id} event={e} />
              ))}
            </ol>
          )}
        </div>
      </Card>
    </section>
  );
}

function AssistantLogItem({ event: e }: { event: InterviewEvent }) {
  const time = <span className="tabular text-xs text-muted">{fmtTime(e.at)}</span>;
  if (e.type === "guardrail_block") {
    const cat = String(e.meta?.category ?? "");
    return (
      <li className="flex flex-col gap-1 rounded-md border border-danger/40 bg-danger-tint px-3.5 py-2.5 break-inside-avoid">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <ShieldX size={14} className="text-danger" aria-hidden />
          <span className="text-[13px] font-semibold text-danger">Blocked by guardrail</span>
          <span className="text-xs text-ink-2">{GUARD_CATEGORY_LABELS[cat] ?? cat}</span>
          {time}
        </div>
        {typeof e.meta?.reason === "string" && e.meta.reason && <p className="m-0 text-[13px] text-ink-2">Why: {e.meta.reason}</p>}
        {typeof e.meta?.refusal === "string" && <p className="m-0 text-[13px] text-muted">Shown to the candidate: “{e.meta.refusal}”</p>}
      </li>
    );
  }
  const candidate = e.type === "assistant_prompt";
  return (
    <li className={`flex flex-col gap-1 break-inside-avoid ${candidate ? "" : "pl-4 sm:pl-8"}`}>
      <div className="flex items-center gap-1.5 text-[13px]">
        {candidate ? <User size={14} className="text-primary" aria-hidden /> : <Bot size={14} className="text-muted" aria-hidden />}
        <span className="font-semibold">{candidate ? "Candidate" : "Assistant"}</span>
        {time}
      </div>
      <div
        className={`rounded-md px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap ${
          candidate ? "bg-primary-tint text-ink" : "border border-border bg-surface text-ink-2"
        }`}
      >
        {e.content}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------
// Integrity
// ---------------------------------------------------------------------

export function IntegrityPanel({ pack, sections, result, events }: { pack: Pack; sections: SectionState[]; result: Result | null; events: InterviewEvent[] }) {
  const of = (type: string, sectionId?: string) => events.filter((e) => e.type === type && (sectionId === undefined || e.sectionId === sectionId));
  const awaySeconds = (sectionId?: string) => Math.round(of("tab_visible", sectionId).reduce((s, e) => s + num(e.meta?.awayMs), 0) / 1000);
  const largest = (sectionId?: string) => Math.max(0, ...of("paste", sectionId).map((e) => num(e.meta?.chars)));
  const timedOut = sections.filter((s) => s.timedOut).map((s) => pack.sections.find((p) => p.id === s.sectionId)?.title ?? s.sectionId);
  const started = pack.sections.filter((p) => sections.some((s) => s.sectionId === p.id));
  const fmtSecs = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

  return (
    <section aria-labelledby="integrity-title" className="flex flex-col gap-3">
      <CardTitle id="integrity-title">Integrity signals</CardTitle>
      <Card className="flex flex-col gap-5 p-5 md:p-6">
        <p className="m-0 flex gap-2 rounded-md bg-subtle px-3.5 py-3 text-sm text-ink-2">
          <ShieldAlert size={16} className="mt-0.5 flex-none text-muted" aria-hidden />
          <span>
            <strong className="text-ink">Signals to discuss, not proof.</strong> Leaving the tab can be a notification or a second screen; a paste
            can be the candidate moving their own text. Ask about anything unusual in the live interview.
          </span>
        </p>

        <dl className="m-0 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Stat label="Left the tab" value={`${of("tab_hidden").length}×`} hint={`${fmtSecs(awaySeconds())} away in total`} />
          <Stat label="Paste events" value={of("paste").length} hint={of("paste").length ? `Largest ${largest().toLocaleString("en-GB")} characters` : undefined} />
          <Stat label="Copy attempts blocked" value={of("copy_blocked").length} />
          <Stat label="Timed-out sections" value={timedOut.length} hint={timedOut.join(", ") || undefined} />
        </dl>

        {started.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="m-0 text-[15px] font-semibold">By section</h3>
            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[460px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Section
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Time away
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      Pastes (largest)
                    </th>
                    <th scope="col" className="py-2 pl-3 text-right font-medium">
                      Copies blocked
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular">
                  {started.map((p) => (
                    <tr key={p.id} className="border-b border-divider last:border-b-0">
                      <th scope="row" className="py-2 pr-3 font-normal text-ink">
                        {p.title}
                      </th>
                      <td className="px-3 py-2 text-right">
                        {of("tab_hidden", p.id).length}× · {fmtSecs(awaySeconds(p.id))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {of("paste", p.id).length}
                        {of("paste", p.id).length > 0 && <span className="text-muted"> ({largest(p.id).toLocaleString("en-GB")} chars)</span>}
                      </td>
                      <td className="py-2 pl-3 text-right">{of("copy_blocked", p.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-2">
            <h3 className="m-0 text-[15px] font-semibold">Points the scorer flagged</h3>
            {result.integrityConcerns.length ? (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {result.integrityConcerns.map((c, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-ink">
                    <CircleAlert size={16} className="mt-0.5 flex-none text-warning-ink" aria-hidden />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="m-0 text-sm text-muted">None.</p>
            )}
          </div>
        )}
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------
// Answers
// ---------------------------------------------------------------------

export function AnswersPanel({
  pack,
  sections,
  events,
  sectionMinutes,
  clientName,
}: {
  pack: Pack;
  sections: SectionState[];
  events: InterviewEvent[];
  sectionMinutes: Record<string, number>;
  clientName: string;
}) {
  const conversation = events.filter((e) => e.type === "persona_message" || e.type === "candidate_message");

  return (
    <section aria-labelledby="answers-title" className="flex flex-col gap-3">
      <CardTitle id="answers-title">Answers</CardTitle>
      {pack.sections.map((sec, idx) => {
        const st = sections.find((s) => s.sectionId === sec.id);
        const mins = sectionMinutes[sec.id];
        return (
          <Card key={sec.id} aria-labelledby={`ans-${sec.id}`} className="flex flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="eyebrow">Section {idx + 1}</span>
                <h3 id={`ans-${sec.id}`} className="m-0 font-serif text-lg font-semibold">
                  {sec.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                {st?.timedOut && <TimedOutBadge />}
                <span className="tabular">
                  {mins != null ? `${mins} of ${sec.durationMin} min` : st ? `In progress · ${sec.durationMin} min allowed` : `${sec.durationMin} min allowed`}
                </span>
              </div>
            </div>

            {!st ? (
              <p className="m-0 text-sm text-muted">Not started.</p>
            ) : sec.kind === "client_conversation" ? (
              conversation.length ? (
                <ol aria-label="Client conversation transcript" className="m-0 flex list-none flex-col gap-3 p-0">
                  {conversation.map((e) => (
                    <TranscriptBubble key={e.id} event={e} clientName={clientName} />
                  ))}
                </ol>
              ) : (
                <p className="m-0 text-sm text-muted">No conversation recorded.</p>
              )
            ) : (
              <div className="flex flex-col gap-5">
                {sec.questions.map((q) => {
                  const answer = st.answers[q.id] ?? "";
                  const words = wordCount(answer);
                  return (
                    <div key={q.id} className="flex flex-col gap-2 break-inside-avoid">
                      <p className="m-0 text-sm font-semibold text-ink">{q.prompt}</p>
                      {answer.trim() ? (
                        <div className="rounded-md bg-subtle px-4 py-3 text-[15px] break-words whitespace-pre-wrap text-ink">{answer}</div>
                      ) : (
                        <p className="m-0 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted">No answer.</p>
                      )}
                      <span className={`tabular text-xs ${words > q.maxWords ? "text-warning-ink" : "text-muted"}`}>
                        {words} words · limit {q.maxWords}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </section>
  );
}

export function TimedOutBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning-tint py-px pr-2 pl-1.5 text-xs font-semibold text-warning-ink">
      <Timer size={13} aria-hidden />
      Timed out
    </span>
  );
}

function TranscriptBubble({ event: e, clientName }: { event: InterviewEvent; clientName: string }) {
  const candidate = e.type === "candidate_message";
  return (
    <li className={`flex max-w-[88%] flex-col gap-1 break-inside-avoid ${candidate ? "items-end self-end" : "items-start"}`}>
      <span className="tabular text-xs text-muted">
        {candidate ? "Candidate" : clientName} · {fmtTime(e.at)}
      </span>
      <div
        className={`px-4 py-3 text-[15px] break-words whitespace-pre-wrap ${
          candidate
            ? "rounded-[12px_4px_12px_12px] bg-primary text-on-primary print:border print:border-border print:bg-surface print:text-ink"
            : "rounded-[4px_12px_12px_12px] border border-border bg-surface text-ink"
        }`}
      >
        {e.content}
      </div>
    </li>
  );
}
