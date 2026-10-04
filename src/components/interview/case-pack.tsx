"use client";

import { useId, useRef, useState } from "react";
import { Lock } from "lucide-react";
import type { CaseExhibit, CasePackView } from "./client";

const TABS = [
  { id: "brief", label: "Brief" },
  { id: "exhibits", label: "Exhibits" },
  { id: "interviews", label: "Interviews" },
  { id: "email", label: "Email" },
] as const;
type Tab = (typeof TABS)[number]["id"];

/**
 * The case pack, read-only. Copying is blocked (and logged) so answers are
 * written in the candidate's own words.
 */
export function CasePackPanel({ casePack, onCopyBlocked }: { casePack: CasePackView; onCopyBlocked: (tab: string) => void }) {
  const [tab, setTab] = useState<Tab>("brief");
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const uid = useId();

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  }

  const block = (e: React.ClipboardEvent) => {
    e.preventDefault();
    onCopyBlocked(tab);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none items-center justify-between gap-2 px-4 pt-4">
        <h2 className="eyebrow m-0">Case pack · {casePack.client}</h2>
        <span className="inline-flex items-center gap-1 text-xs text-faint" title="Copying from the case pack is disabled">
          <Lock size={12} aria-hidden />
          Copy disabled
        </span>
      </div>
      <div role="tablist" aria-label="Case pack" className="flex flex-none gap-1 border-b border-border px-3 pt-2">
        {TABS.map((t, i) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px border-b-2 px-2.5 py-2 text-sm transition-colors duration-150 ${
                selected ? "border-primary font-semibold text-ink" : "border-transparent font-medium text-muted hover:text-ink"
              }`}
            >
              {t.label}
              {t.id === "exhibits" && <span className="tabular ml-1 text-xs text-faint">{casePack.exhibits.length}</span>}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${uid}-panel-${tab}`}
        aria-labelledby={`${uid}-tab-${tab}`}
        tabIndex={0}
        onCopy={block}
        onCut={block}
        onDragStart={(e) => e.preventDefault()}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 select-none focus-visible:outline-offset-[-2px]"
      >
        {tab === "brief" && (
          <div className="flex flex-col gap-3">
            <span className="eyebrow">The question</span>
            <p className="m-0 font-serif text-[17px] leading-relaxed">{casePack.question}</p>
            <p className="m-0 text-sm text-muted">
              Use the tabs above for the {casePack.exhibits.length} exhibits, {casePack.interviews.length} interview notes and the CEO&apos;s email.
            </p>
          </div>
        )}
        {tab === "exhibits" && (
          <div className="flex flex-col gap-5">
            {casePack.exhibits.map((ex) => (
              <ExhibitView key={ex.id} exhibit={ex} />
            ))}
          </div>
        )}
        {tab === "interviews" && (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {casePack.interviews.map((iv) => (
              <li key={iv.id} className="rounded-lg border border-border bg-surface p-3.5">
                <div className="mb-1 flex items-baseline gap-2 text-[13px]">
                  <span className="tabular font-semibold text-muted">{iv.id}</span>
                  <span className="font-semibold">{iv.who}</span>
                </div>
                <p className="m-0 text-[15px] leading-relaxed text-ink-2">“{iv.notes}”</p>
              </li>
            ))}
          </ul>
        )}
        {tab === "email" && (
          <div className="rounded-lg border border-border bg-surface p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-ink-2">{casePack.clientEmail}</div>
        )}
      </div>
    </div>
  );
}

/** Exhibits arrive as pipe tables ("A | B\n1 | 2"); render them as real tables. */
function ExhibitView({ exhibit }: { exhibit: CaseExhibit }) {
  const rows = exhibit.data
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const isTable = exhibit.kind === "table" || rows.every((r) => r.includes("|"));
  const caption = (
    <>
      <span className="tabular mr-1.5 font-semibold text-muted">{exhibit.id}</span>
      {exhibit.title}
    </>
  );

  if (!isTable || rows.length < 2) {
    return (
      <figure className="m-0 flex flex-col gap-2">
        <figcaption className="text-sm font-semibold">{caption}</figcaption>
        <div className="rounded-lg border border-border bg-surface p-3 text-sm whitespace-pre-wrap text-ink-2">{exhibit.data}</div>
      </figure>
    );
  }

  const cells = rows.map((r) =>
    r
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim()),
  );
  const [head, ...body] = cells.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
  const numeric = (c: string) => /^[£$€]?[-–+]?[\d.,]+%?(m|bn|k)?$/.test(c) || c === "–" || c === "";

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full border-collapse text-[13px]">
        <caption className="border-b border-border px-3 py-2.5 text-left text-sm font-semibold">{caption}</caption>
        <thead>
          <tr className="bg-subtle">
            {head.map((h, i) => (
              <th key={i} scope="col" className={`border-b border-border px-3 py-2 font-semibold text-ink-2 ${i === 0 ? "text-left" : "text-right"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, ri) => {
            const total = /^total$/i.test(r[0] ?? "");
            return (
              <tr key={ri} className={`border-b border-divider last:border-b-0 ${total ? "font-semibold" : ""}`}>
                {head.map((_, ci) => {
                  const c = r[ci] ?? "";
                  return ci === 0 ? (
                    <th key={ci} scope="row" className={`px-3 py-2 text-left align-top ${total ? "font-semibold" : "font-normal"}`}>
                      {c}
                    </th>
                  ) : (
                    <td key={ci} className={`tabular px-3 py-2 align-top ${numeric(c) ? "text-right" : "text-left"}`}>
                      {c}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
