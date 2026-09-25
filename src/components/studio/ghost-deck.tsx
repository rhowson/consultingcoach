"use client";

import type { KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2, Wand2 } from "lucide-react";
import type { Exhibit, GhostSlide, PyramidNode } from "@/lib/types";
import { CHART_TYPES, MAX_TITLE_WORDS, focusField, uid, wordCount } from "./model";
import { exhibitBars, exhibitNumber } from "./exhibit-data";
import { MiniBars } from "./case-pack";
import { Pin } from "./pin";

const SLIDE_TYPES: { value: GhostSlide["slideType"]; label: string }[] = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
  { value: "text", label: "Text" },
  { value: "framework", label: "Framework" },
];

const selectCls = "h-9 min-w-0 rounded-md border border-border bg-surface px-2 text-[13px] text-ink";

/** The 16:9 thumbnail of a ghost slide (shared with the read-only view). */
export function SlideThumb({ slide, exhibits, pin }: { slide: GhostSlide; exhibits: Exhibit[]; pin?: number }) {
  const ex = exhibits.find((e) => e.id === slide.exhibitId);
  const needsEx = slide.slideType === "chart" || slide.slideType === "table";
  const bars = ex && needsEx ? exhibitBars(ex) : [];
  const exN = exhibitNumber(exhibits, slide.exhibitId);
  const foot = ex
    ? `Source: Exhibit ${exN} · ${ex.title}`
    : slide.slideType === "text"
      ? "Executive summary"
      : slide.slideType === "framework"
        ? "Framework"
        : "";
  return (
    <div className="relative flex aspect-video flex-col gap-2 border-b border-border bg-subtle px-4 py-3.5">
      <span className={`line-clamp-2 pr-6 font-serif text-[13px] leading-[1.3] font-semibold ${slide.actionTitle ? "text-ink" : "text-faint"}`}>
        {slide.actionTitle || "Untitled slide"}
      </span>
      {needsEx && ex && (bars.length > 1 ? <MiniBars bars={bars} className="min-h-0 flex-1" /> : <TableSkeleton />)}
      {needsEx && !ex && (
        <div className="flex flex-1 items-center justify-center rounded border border-dashed border-border-strong text-xs text-muted">Pick an exhibit</div>
      )}
      {slide.slideType === "text" && (
        <div aria-hidden className="flex flex-1 flex-col justify-center gap-1.5">
          <span className="h-1.5 w-[92%] rounded-full bg-border" />
          <span className="h-1.5 w-[80%] rounded-full bg-border" />
          <span className="h-1.5 w-[86%] rounded-full bg-border" />
        </div>
      )}
      {slide.slideType === "framework" && (
        <div aria-hidden className="grid flex-1 grid-cols-3 gap-1.5">
          <span className="rounded border border-border-strong" />
          <span className="rounded border border-border-strong" />
          <span className="rounded border border-border-strong" />
        </div>
      )}
      <span className="truncate text-[10px] text-muted">
        {foot}
        {slide.chartType && slide.slideType === "chart" ? ` · ${slide.chartType}` : ""}
      </span>
      {pin && <Pin n={pin} className="absolute top-2 right-2" />}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div aria-hidden className="grid flex-1 grid-cols-4 content-center gap-1">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full ${i < 4 ? "bg-border-strong" : "bg-border"}`} />
      ))}
    </div>
  );
}

export function GhostDeck({
  slides,
  exhibits,
  pyramid,
  onChange,
  pins,
}: {
  slides: GhostSlide[];
  exhibits: Exhibit[];
  pyramid: PyramidNode;
  onChange: (next: GhostSlide[]) => void;
  pins: Record<string, number>;
}) {
  const update = (id: string, patch: Partial<GhostSlide>) => onChange(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  function move(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    const next = [...slides];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    focusField(slides[i].id);
  }
  function add() {
    const id = uid("sl");
    onChange([...slides, { id, actionTitle: "", slideType: "chart" }]);
    focusField(id);
  }
  function fromPyramid() {
    const exec: GhostSlide = { id: uid("sl"), actionTitle: pyramid.text, slideType: "text" };
    const body = pyramid.children.map((kl): GhostSlide => ({ id: uid("sl"), actionTitle: kl.text, slideType: "chart" }));
    onChange([exec, ...body]);
  }
  const titleKey = (i: number) => (e: KeyboardEvent) => {
    if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowUp")) {
      e.preventDefault();
      move(i, -1);
    } else if (e.altKey && (e.key === "ArrowRight" || e.key === "ArrowDown")) {
      e.preventDefault();
      move(i, 1);
    }
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4">
      {slides.length === 0 && pyramid.text.trim() && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <span className="flex-1">Start from your pyramid: an executive summary, then one slide per key line.</span>
          <button
            type="button"
            onClick={fromPyramid}
            className="flex h-8 items-center gap-1.5 rounded-md border border-primary px-3 text-[13px] font-semibold text-primary hover:bg-primary-tint"
          >
            <Wand2 size={14} aria-hidden />
            Draft slides from pyramid
          </button>
        </div>
      )}
      <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 p-0">
        {slides.map((sl, i) => {
          const words = wordCount(sl.actionTitle);
          const over = words > MAX_TITLE_WORDS;
          const fid = `title-${sl.id}`;
          return (
            <li
              key={sl.id}
              className={`relative flex flex-col overflow-hidden rounded-lg border bg-surface ${pins[sl.id] ? "border-accent" : "border-border"}`}
            >
              <SlideThumb slide={sl} exhibits={exhibits} pin={pins[sl.id]} />
              <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-4">
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor={fid} className="text-xs font-semibold text-muted">
                    Slide {i + 1} · Action title
                  </label>
                  <span className={`tabular text-xs font-semibold ${over ? "text-danger" : "text-muted"}`} aria-live="polite">
                    {words} / {MAX_TITLE_WORDS} words
                  </span>
                </div>
                <textarea
                  id={fid}
                  data-field={sl.id}
                  value={sl.actionTitle}
                  onChange={(e) => update(sl.id, { actionTitle: e.target.value })}
                  onKeyDown={titleKey(i)}
                  placeholder="What does this slide prove?"
                  aria-invalid={over || undefined}
                  className="field-sizing-content min-h-16 resize-none rounded-md border border-border bg-surface px-2.5 py-2 text-sm leading-[1.45] text-ink placeholder:text-faint"
                />
                <div className="grid grid-cols-[1fr_1.4fr] gap-2">
                  <select
                    aria-label={`Slide ${i + 1} type`}
                    value={sl.slideType}
                    onChange={(e) => update(sl.id, { slideType: e.target.value as GhostSlide["slideType"] })}
                    className={selectCls}
                  >
                    {SLIDE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={`Slide ${i + 1} exhibit`}
                    value={sl.exhibitId ?? ""}
                    onChange={(e) => update(sl.id, { exhibitId: e.target.value || undefined })}
                    className={selectCls}
                  >
                    <option value="">No exhibit</option>
                    {exhibits.map((ex, n) => (
                      <option key={ex.id} value={ex.id}>
                        {n + 1} · {ex.title}
                      </option>
                    ))}
                  </select>
                </div>
                {sl.slideType === "chart" && (
                  <select
                    aria-label={`Slide ${i + 1} chart type`}
                    value={sl.chartType ?? ""}
                    onChange={(e) => update(sl.id, { chartType: e.target.value || undefined })}
                    className={selectCls}
                  >
                    <option value="">Chart type…</option>
                    {CHART_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move slide ${i + 1} earlier`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink disabled:opacity-40"
                  >
                    <ArrowLeft size={16} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === slides.length - 1}
                    aria-label={`Move slide ${i + 1} later`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-hover hover:text-ink disabled:opacity-40"
                  >
                    <ArrowRight size={16} aria-hidden />
                  </button>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onChange(slides.filter((s) => s.id !== sl.id));
                      if (slides[i - 1]) focusField(slides[i - 1].id);
                    }}
                    aria-label={`Delete slide ${i + 1}`}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-faint hover:bg-hover hover:text-danger"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        <li className="flex">
          <button
            type="button"
            onClick={add}
            className="flex min-h-[200px] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong text-sm font-medium text-primary hover:bg-primary-tint"
          >
            <Plus size={20} aria-hidden />
            Add slide
          </button>
        </li>
      </ol>
      <p className="m-0 text-xs text-muted">Alt+←/→ in a title moves the slide · Keep every title to {MAX_TITLE_WORDS} words or fewer</p>
    </div>
  );
}
