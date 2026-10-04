"use client";

import { useId } from "react";
import { TriangleAlert } from "lucide-react";
import { wordCount, type PackQuestion } from "./client";

/** One written answer with a live word count against a soft limit (warns, never blocks). */
export function AnswerField({
  question,
  number,
  value,
  onChange,
  onBlur,
  onPaste,
  disabled,
  tall = false,
}: {
  question: PackQuestion;
  number?: number;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  tall?: boolean;
}) {
  const id = useId();
  const words = wordCount(value);
  const over = words > question.maxWords;
  const near = !over && words >= question.maxWords * 0.9;

  return (
    <div className={`flex flex-col gap-2 ${tall ? "min-h-0 flex-1" : ""}`}>
      <label htmlFor={id} className="flex gap-2 text-[15px] leading-snug font-semibold">
        {number != null && <span className="tabular flex-none text-muted">{number}.</span>}
        <span>{question.prompt}</span>
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onPaste={onPaste}
        disabled={disabled}
        aria-describedby={`${id}-count`}
        spellCheck
        className={`w-full resize-y rounded-lg border bg-surface px-3.5 py-3 text-[15px] leading-relaxed text-ink placeholder:text-faint focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none disabled:opacity-60 ${
          over ? "border-warning" : "border-border-strong"
        } ${tall ? "min-h-[280px] flex-1 lg:resize-none" : "min-h-[140px]"}`}
        placeholder="Type your answer…"
      />
      <span className="sr-only" aria-live="polite">
        {over ? `Over the ${question.maxWords}-word guide.` : ""}
      </span>
      <div id={`${id}-count`} className="flex items-center justify-end gap-1.5 text-xs">
        {over ? (
          <span className="inline-flex items-center gap-1 font-semibold text-warning-ink">
            <TriangleAlert size={12} aria-hidden />
            <span className="tabular">
              {words} / {question.maxWords} words
            </span>
            — over the guide by {words - question.maxWords}. Consider tightening it.
          </span>
        ) : (
          <span className={`tabular ${near ? "text-warning-ink" : "text-muted"}`}>
            {words} / {question.maxWords} words
          </span>
        )}
      </div>
    </div>
  );
}
