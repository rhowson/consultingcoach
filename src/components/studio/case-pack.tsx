"use client";

import { useState, type KeyboardEvent } from "react";
import { Target } from "lucide-react";
import type { Storyboard } from "@/lib/client/api";
import { exhibitBars } from "./exhibit-data";

const TABS = [
  { key: "brief", label: "Brief" },
  { key: "exhibits", label: "Exhibits" },
  { key: "notes", label: "Notes" },
  { key: "email", label: "Email" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function MiniBars({ bars, className = "h-16" }: { bars: ReturnType<typeof exhibitBars>; className?: string }) {
  return (
    <div aria-hidden className={`flex items-end gap-1 border-b border-border ${className}`}>
      {bars.map((b, i) => (
        <div key={i} className={`flex-1 rounded-t-[2px] ${b.highlight ? "bg-primary" : "bg-border-strong"}`} style={{ height: `${b.pct}%` }} />
      ))}
    </div>
  );
}

export function CasePack({ sb }: { sb: Storyboard }) {
  const [tab, setTab] = useState<Tab>("brief");
  const pack = sb.case.casePack!;
  const brief = sb.case.briefing;

  function onKey(e: KeyboardEvent) {
    const i = TABS.findIndex((t) => t.key === tab);
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = TABS[(i + d + TABS.length) % TABS.length].key;
    setTab(next);
    document.getElementById(`cp-tab-${next}`)?.focus();
  }

  const [from, subject, ...rest] = pack.clientEmail.split("\n");
  const hasHeader = /^from:/i.test(from ?? "") && /^subject:/i.test(subject ?? "");
  const emailBody = (hasHeader ? rest : pack.clientEmail.split("\n")).join("\n").trim().split(/\n\s*\n/);

  return (
    <aside aria-label="Case pack" className="flex min-h-0 w-[300px] flex-none flex-col border-r border-border bg-surface">
      <div className="flex flex-col gap-3 px-4 pt-4">
        <span className="eyebrow">Case pack</span>
        <div role="tablist" aria-label="Case pack sections" className="flex gap-0.5 border-b border-border" onKeyDown={onKey}>
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                id={`cp-tab-${t.key}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="cp-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setTab(t.key)}
                className={`h-9 flex-1 text-[13px] ${on ? "font-semibold text-ink shadow-[inset_0_-2px_0_var(--primary)]" : "font-medium text-muted hover:text-ink"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        id="cp-panel"
        role="tabpanel"
        aria-labelledby={`cp-tab-${tab}`}
        tabIndex={0}
        className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4 text-sm leading-[1.55]"
      >
        {tab === "brief" && (
          <>
            <p className="m-0 text-ink-2">{brief.situation}</p>
            <p className="m-0 text-ink-2">
              <b className="font-semibold text-ink">The question:</b> {pack.question}
            </p>
            <div className="flex flex-col gap-1 rounded-md bg-subtle px-3.5 py-3">
              <span className="flex items-center gap-1.5 font-semibold">
                <Target size={16} className="text-primary" aria-hidden />
                Your task
              </span>
              <span>{brief.objective}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">Your role</span>
              <span className="text-ink-2">{brief.yourRole}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-semibold">In the pack</span>
              <span className="text-ink-2">
                {pack.exhibits.length} data exhibits, {pack.interviews.length} interview notes and the client&apos;s email.
              </span>
            </div>
          </>
        )}
        {tab === "exhibits" &&
          pack.exhibits.map((ex, i) => {
            const bars = exhibitBars(ex);
            return (
              <div key={ex.id} className="flex flex-col gap-2.5 rounded-lg border border-border p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold">{ex.title}</span>
                  <span className="text-xs whitespace-nowrap text-muted">Exhibit {i + 1}</span>
                </div>
                {bars.length > 1 && <MiniBars bars={bars} />}
                <pre className="m-0 overflow-x-auto font-sans text-xs whitespace-pre-wrap text-muted">{ex.data}</pre>
              </div>
            );
          })}
        {tab === "notes" &&
          pack.interviews.map((n) => (
            <div key={n.id} className="flex flex-col gap-1 border-b border-divider pb-3.5">
              <span className="text-[13px] font-semibold">{n.who}</span>
              <span className="text-ink-2">“{n.notes}”</span>
            </div>
          ))}
        {tab === "email" && (
          <>
            {hasHeader && (
              <div className="flex flex-col gap-0.5 border-b border-border pb-3 text-[13px] text-muted">
                <span>
                  <b className="font-semibold text-ink">{from.replace(/^from:\s*/i, "")}</b>, {pack.client}
                </span>
                <span>{subject}</span>
              </div>
            )}
            {emailBody.map((p, i) => (
              <p key={i} className="m-0 whitespace-pre-line">
                {p}
              </p>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
