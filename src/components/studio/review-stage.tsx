import { Check, TriangleAlert } from "lucide-react";
import type { Exhibit, GhostSlide, PyramidNode, StudioComment } from "@/lib/types";
import { MAX_TITLE_WORDS, wordCount } from "./model";
import { SlideThumb } from "./ghost-deck";

export function checklist(pyramid: PyramidNode, slides: GhostSlide[], comments: StudioComment[]) {
  const lines = pyramid.children;
  const needsEx = slides.filter((s) => s.slideType === "chart" || s.slideType === "table");
  return [
    { label: "Governing thought answers the question", ok: wordCount(pyramid.text) >= 8, detail: pyramid.text.trim() ? "At least one full sentence" : "Not written yet" },
    { label: "3–5 key lines, each with support", ok: lines.length >= 3 && lines.every((l) => l.text.trim() && l.children.some((c) => c.text.trim())), detail: `${lines.length} key line${lines.length === 1 ? "" : "s"}` },
    { label: "Every slide has an action title", ok: slides.length > 0 && slides.every((s) => s.actionTitle.trim()), detail: `${slides.length} slide${slides.length === 1 ? "" : "s"}` },
    { label: `Titles are ${MAX_TITLE_WORDS} words or fewer`, ok: slides.length > 0 && slides.every((s) => wordCount(s.actionTitle) <= MAX_TITLE_WORDS), detail: `${slides.filter((s) => wordCount(s.actionTitle) > MAX_TITLE_WORDS).length} over the limit` },
    { label: "Chart and table slides cite an exhibit", ok: needsEx.every((s) => s.exhibitId), detail: `${needsEx.filter((s) => !s.exhibitId).length} missing` },
    { label: "No open must-fix comments", ok: !comments.some((c) => !c.resolved && c.severity === "must_fix"), detail: "From the coach's review" },
  ];
}

export function Checklist({ items }: { items: ReturnType<typeof checklist> }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {items.map((it) => (
        <li key={it.label} className="flex items-start gap-2.5">
          {it.ok ? (
            <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-success text-white">
              <Check size={12} strokeWidth={2.5} aria-hidden />
            </span>
          ) : (
            <span className="h-5 w-5 flex-none rounded-full border-[1.5px] border-border-strong" aria-hidden />
          )}
          <span className="flex flex-col leading-snug">
            <span className={`text-sm ${it.ok ? "text-ink" : "text-ink-2"}`}>
              <span className="sr-only">{it.ok ? "Done: " : "To do: "}</span>
              {it.label}
            </span>
            <span className="text-xs text-muted">{it.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** "What the CEO reads if she only reads the titles." */
export function TitleReadThrough({ slides, large = true }: { slides: GhostSlide[]; large?: boolean }) {
  return (
    <ol className="m-0 list-none rounded-lg border border-border bg-surface px-4 py-2 md:px-6">
      {slides.length === 0 && <li className="py-4 text-sm text-muted">No slides yet. Build the ghost deck first.</li>}
      {slides.map((sl, i) => {
        const words = wordCount(sl.actionTitle);
        return (
          <li key={sl.id} className={`flex items-baseline gap-4 py-4 ${i ? "border-t border-border" : ""}`}>
            <span className="tabular w-5 flex-none text-sm font-semibold text-muted">{i + 1}</span>
            <span
              className={`flex-1 font-serif leading-[1.35] font-semibold ${large ? "text-[17px] md:text-[21px]" : "text-[17px]"} ${sl.actionTitle ? "text-ink" : "text-faint"}`}
            >
              {sl.actionTitle || "Untitled slide"}
            </span>
            {words > MAX_TITLE_WORDS && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-warning-ink">
                <TriangleAlert size={14} aria-hidden />
                {words} words
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Read-only view of the pyramid and deck (mobile, and after submission). */
export function ReadOnlyStoryboard({ pyramid, slides, exhibits }: { pyramid: PyramidNode; slides: GhostSlide[]; exhibits: Exhibit[] }) {
  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-8">
      <section aria-labelledby="ro-pyr" className="flex flex-col gap-4">
        <h2 id="ro-pyr" className="eyebrow m-0">
          Pyramid
        </h2>
        <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4">
          <span className="eyebrow">Governing thought</span>
          <span className={`font-serif text-lg leading-[1.35] font-semibold ${pyramid.text ? "" : "text-faint"}`}>{pyramid.text || "Not written yet"}</span>
        </div>
        {pyramid.children.map((kl, i) => (
          <div key={kl.id} className="flex flex-col gap-1.5 border-l-2 border-border pl-3">
            <span className="text-[15px] font-semibold">
              {i + 1}. {kl.text || <span className="text-faint">Empty key line</span>}
            </span>
            {kl.children.map((sp) => (
              <span key={sp.id} className="pl-3 text-sm text-ink-2">
                – {sp.text}
              </span>
            ))}
          </div>
        ))}
      </section>
      <section aria-labelledby="ro-deck" className="flex flex-col gap-4">
        <h2 id="ro-deck" className="eyebrow m-0">
          Ghost deck
        </h2>
        {slides.length === 0 ? (
          <p className="m-0 text-sm text-muted">No slides yet.</p>
        ) : (
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 p-0">
            {slides.map((sl, i) => (
              <li key={sl.id} className="overflow-hidden rounded-lg border border-border bg-surface">
                <SlideThumb slide={sl} exhibits={exhibits} />
                <div className="px-4 py-3 text-sm">
                  <span className="text-xs font-semibold text-muted">Slide {i + 1}</span>
                  <p className="m-0">{sl.actionTitle || <span className="text-faint">Untitled slide</span>}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
