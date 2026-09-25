"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, CircleAlert, Copy, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { LEVEL_LABELS, type Level } from "@/lib/competency";
import type { RedPenAnnotation, RedPenResult } from "@/lib/types";
import { Card, CardTitle, Eyebrow } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LevelBadge, VerdictChip } from "@/components/ui/badges";
import { DELIVERABLE_LABEL, SEVERITIES, type DeliverableType } from "./meta";

interface ReviewData {
  id: string;
  title: string;
  content: string;
  deliverableType: DeliverableType;
  targetLevel: Level;
  createdAt: string;
  result: RedPenResult | null;
}

type Numbered = RedPenAnnotation & { n: number; start: number | null };

/** Locate each quote in the document (first non-overlapping match) and number annotations in reading order. */
function locate(content: string, annotations: RedPenAnnotation[]): Numbered[] {
  const taken: [number, number][] = [];
  const lower = content.toLowerCase();
  const found = annotations.map((a) => {
    const q = a.quote.trim();
    if (!q) return { ...a, start: null };
    let from = 0;
    while (from <= content.length) {
      let at = content.indexOf(q, from);
      if (at < 0) at = lower.indexOf(q.toLowerCase(), from);
      if (at < 0) break;
      const end = at + q.length;
      if (!taken.some(([s, e]) => at < e && end > s)) {
        taken.push([at, end]);
        return { ...a, quote: content.slice(at, end), start: at };
      }
      from = at + 1;
    }
    return { ...a, start: null };
  });
  const ordered = [...found].sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity));
  return ordered.map((a, i) => ({ ...a, n: i + 1 }));
}

export function ReviewView({ review }: { review: ReviewData }) {
  const router = useRouter();
  const notes = useMemo(() => locate(review.content, review.result?.annotations ?? []), [review]);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<number | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      await api.redPen.delete(review.id);
      router.push("/red-pen");
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't delete. Please try again.");
      setDeleting(false);
    }
  }

  const r = review.result;
  const severityOf = (n: Numbered) => SEVERITIES.find((s) => s.value === n.severity) ?? SEVERITIES[2];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card className="flex flex-col gap-5 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Eyebrow>
              {DELIVERABLE_LABEL[review.deliverableType]} · {new Date(review.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </Eyebrow>
            <h2 className="m-0 font-serif text-[26px] leading-tight font-semibold tracking-tight md:text-[28px]">{review.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
              {r && <VerdictChip verdict={r.verdict} />}
              <span>Marked against the</span>
              <LevelBadge level={review.targetLevel} />
              <span>bar</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {confirming ? (
              <>
                <span className="text-sm text-ink-2">Delete this review?</span>
                <Button variant="destructive" size="sm" onClick={remove} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={deleting} autoFocus>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
                <Trash2 size={15} aria-hidden /> Delete review
              </Button>
            )}
          </div>
        </div>
        {error && (
          <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
            <CircleAlert size={16} aria-hidden /> {error}
          </p>
        )}
        {r ? (
          <div className="grid grid-cols-1 gap-5 border-t border-border pt-5 lg:grid-cols-[1.2fr_1fr]">
            <p className="m-0 font-serif text-xl leading-snug font-semibold text-ink">{r.headline}</p>
            {r.topChanges.length > 0 && (
              <div className="flex flex-col gap-3">
                <Eyebrow>Top {Math.min(3, r.topChanges.length)} changes</Eyebrow>
                <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {r.topChanges.slice(0, 3).map((c, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-4 flex-none font-serif text-xl leading-none font-semibold text-accent" aria-hidden>
                        {i + 1}
                      </span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <p className="m-0 text-sm text-muted">This review has no result yet.</p>
        )}
      </Card>

      {r && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Document */}
          <Card aria-labelledby="doc-title" className="flex min-w-0 flex-col gap-4 p-6 lg:col-span-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <CardTitle id="doc-title">Your draft</CardTitle>
              <span className="text-xs text-muted">{LEVEL_LABELS[review.targetLevel]} markup · numbered pins match the notes</span>
            </div>
            <Document content={review.content} notes={notes} active={active} onFocusNote={setActive} pinClass={(n) => severityOf(n).pin} />
          </Card>

          {/* Annotations */}
          <div className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-24 lg:col-span-5 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            {notes.length === 0 && <Card className="p-6 text-sm text-muted">No line-level notes on this one.</Card>}
            {SEVERITIES.map((s) => {
              const group = notes.filter((n) => n.severity === s.value);
              if (!group.length) return null;
              return (
                <section key={s.value} aria-labelledby={`sev-${s.value}`} className="flex flex-col gap-3">
                  <h3 id={`sev-${s.value}`} className="m-0 flex items-center gap-2 text-sm font-semibold">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                    <span className="tabular text-muted">{group.length}</span>
                  </h3>
                  {group.map((n) => (
                    <Note key={n.id} note={n} pin={s.pin} label={s.label} active={active === n.n} onHover={setActive} />
                  ))}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Document({
  content,
  notes,
  active,
  onFocusNote,
  pinClass,
}: {
  content: string;
  notes: Numbered[];
  active: number | null;
  onFocusNote: (n: number | null) => void;
  pinClass: (n: Numbered) => string;
}) {
  const placed = notes.filter((n) => n.start != null).sort((a, b) => a.start! - b.start!);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const n of placed) {
    if (n.start! > cursor) parts.push(content.slice(cursor, n.start!));
    parts.push(
      <mark
        key={n.id}
        id={`mark-${n.n}`}
        className={`scroll-mt-24 rounded-sm px-0.5 text-ink transition-colors ${
          n.severity === "must_fix" ? "bg-danger-tint" : n.severity === "should_fix" ? "bg-warning-tint" : "bg-primary-tint"
        } ${active === n.n ? "outline-2 outline-offset-1 outline-accent" : ""}`}
        style={{ textDecoration: "underline", textDecorationColor: "var(--border-strong)", textUnderlineOffset: 3 }}
      >
        <a
          href={`#note-${n.n}`}
          onMouseEnter={() => onFocusNote(n.n)}
          onMouseLeave={() => onFocusNote(null)}
          onFocus={() => onFocusNote(n.n)}
          onBlur={() => onFocusNote(null)}
          aria-label={`Note ${n.n}`}
          className={`mr-1 inline-flex h-[18px] min-w-[18px] -translate-y-px items-center justify-center rounded-full px-1 align-middle font-sans text-[11px] font-semibold no-underline ${pinClass(n)}`}
        >
          {n.n}
        </a>
        {content.slice(n.start!, n.start! + n.quote.length)}
      </mark>,
    );
    cursor = n.start! + n.quote.length;
  }
  if (cursor < content.length) parts.push(content.slice(cursor));
  const unplaced = notes.filter((n) => n.start == null);

  return (
    <div className="flex flex-col gap-4">
      <div className="max-h-[70vh] overflow-y-auto rounded-md border border-divider bg-subtle p-4 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-ink-2 md:p-5">
        {parts}
      </div>
      {unplaced.length > 0 && (
        <p className="m-0 text-xs text-muted">
          {unplaced.length === 1 ? "Note" : "Notes"} {unplaced.map((n) => n.n).join(", ")} refer to text that couldn&apos;t be matched exactly; see the
          quoted text in the note.
        </p>
      )}
    </div>
  );
}

function Note({ note, pin, label, active, onHover }: { note: Numbered; pin: string; label: string; active: boolean; onHover: (n: number | null) => void }) {
  return (
    <Card
      id={`note-${note.n}`}
      aria-label={`Note ${note.n}, ${label}`}
      onMouseEnter={() => onHover(note.n)}
      onMouseLeave={() => onHover(null)}
      className={`flex scroll-mt-24 flex-col gap-3 p-4 transition-colors ${active ? "border-accent" : ""}`}
    >
      <div className="flex items-start gap-2.5">
        <span className={`flex h-[22px] min-w-[22px] flex-none items-center justify-center rounded-full px-1 text-xs font-semibold ${pin}`} aria-hidden>
          {note.n}
        </span>
        <blockquote className="m-0 min-w-0 flex-1 border-l-2 border-border-strong pl-2.5 text-[13px] text-muted italic">
          {note.start != null ? (
            <a href={`#mark-${note.n}`} className="text-muted no-underline hover:underline">
              “{truncate(note.quote, 160)}”
            </a>
          ) : (
            <>
              “{truncate(note.quote, 160)}” <span className="not-italic">(not found in the text)</span>
            </>
          )}
        </blockquote>
      </div>
      <p className="m-0 text-sm text-ink">{note.comment}</p>
      {note.rewrite && (
        <div className="flex flex-col gap-2 rounded-md bg-success-tint px-3.5 py-3">
          <span className="text-xs font-semibold tracking-wide text-success uppercase">Rewrite</span>
          <p className="m-0 text-sm whitespace-pre-wrap text-ink">{note.rewrite}</p>
          <CopyButton text={note.rewrite} />
        </div>
      )}
    </Card>
  );
}

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
    }
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2000);
  }
  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy} className="self-start">
      {state === "copied" ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Copy failed — select the text" : "Copy rewrite"}</span>
    </Button>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
