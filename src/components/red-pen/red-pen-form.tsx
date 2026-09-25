"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleAlert, Info, LoaderCircle, PenLine } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { LEVELS, LEVEL_LABELS, type Level } from "@/lib/competency";
import { Button } from "@/components/ui/button";
import { DELIVERABLE_TYPES, type DeliverableType } from "./meta";

export const fieldClass =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink placeholder:text-faint focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary";

const MIN = 20;
const MAX = 60_000;

export function RedPenForm({ defaultLevel }: { defaultLevel: Level }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DeliverableType>("steerco_deck");
  const [level, setLevel] = useState<Level>(defaultLevel);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < MIN) {
      setError(`Paste at least ${MIN} characters of your deliverable.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { review } = await api.redPen.create({ title: title.trim(), content, deliverableType: type, targetLevel: level });
      router.push(`/red-pen/${review.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The review failed. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={busy}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rp-title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="rp-title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Churn diagnostic — SteerCo 3 pre-read"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0 sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium">Deliverable type</legend>
          <div className="flex flex-wrap gap-2">
            {DELIVERABLE_TYPES.map((d) => (
              <label
                key={d.value}
                className={`inline-flex h-9 cursor-pointer items-center rounded-md border px-3.5 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                  type === d.value ? "border-primary bg-primary-tint text-primary" : "border-border bg-surface text-ink-2 hover:bg-hover"
                }`}
              >
                <input type="radio" name="rp-type" value={d.value} checked={type === d.value} onChange={() => setType(d.value)} className="sr-only" />
                {d.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rp-level" className="text-sm font-medium">
            Mark it against
          </label>
          <select id="rp-level" value={level} onChange={(e) => setLevel(e.target.value as Level)} className={fieldClass}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]} bar
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="rp-content" className="text-sm font-medium">
          Paste the text of your deliverable
        </label>
        <p id="rp-hint" className="m-0 flex items-start gap-1.5 text-[13px] text-muted">
          <Info size={15} className="mt-0.5 flex-none" aria-hidden />
          File upload isn&apos;t supported yet — copy the slide titles and body text in order. Remove client names and anything else that identifies
          the client first.
        </p>
        <textarea
          id="rp-content"
          aria-describedby="rp-hint rp-count"
          required
          rows={14}
          maxLength={MAX}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={"Slide 1 — Executive summary\nSMB churn doubled after contract end, driven by …"}
          className={`${fieldClass} h-auto min-h-[280px] resize-y py-2.5 leading-relaxed`}
        />
        <span id="rp-count" className="tabular self-end text-xs text-muted">
          {content.length.toLocaleString()} / {MAX.toLocaleString()} characters
        </span>
      </div>

      {error && (
        <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
          <CircleAlert size={16} aria-hidden />
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={busy}>
          {busy ? <LoaderCircle size={18} className="animate-spin" aria-hidden /> : <PenLine size={18} aria-hidden />}
          {busy ? "Partner is marking up…" : "Get the red pen"}
        </Button>
        {busy && (
          <span role="status" className="text-sm text-muted">
            This can take up to a minute.
          </span>
        )}
      </div>
    </form>
  );
}
