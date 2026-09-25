"use client";

import { useState, type DragEvent, type KeyboardEvent } from "react";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import type { PyramidNode } from "@/lib/types";
import { MAX_KEY_LINES, focusField, uid } from "./model";
import { Pin } from "./pin";

type Lines = PyramidNode[];
const clone = (lines: Lines): Lines => lines.map((l) => ({ ...l, children: [...l.children] }));

export function PyramidEditor({
  pyramid,
  onChange,
  pins,
}: {
  pyramid: PyramidNode;
  onChange: (next: PyramidNode) => void;
  pins: Record<string, number>;
}) {
  const [drag, setDrag] = useState<string | null>(null);
  const lines = pyramid.children;
  const n = Math.max(lines.length, 1);

  const setLines = (fn: (L: Lines) => Lines) => onChange({ ...pyramid, children: fn(clone(lines)) });

  function moveLine(i: number, d: number) {
    const j = i + d;
    if (j < 0 || j >= lines.length) return;
    const id = lines[i].id;
    setLines((L) => {
      [L[i], L[j]] = [L[j], L[i]];
      return L;
    });
    focusField(id);
  }
  function moveSup(i: number, k: number, d: number) {
    const S = lines[i].children;
    const j = k + d;
    if (j < 0 || j >= S.length) return;
    const id = S[k].id;
    setLines((L) => {
      const s = L[i].children;
      [s[k], s[j]] = [s[j], s[k]];
      return L;
    });
    focusField(id);
  }
  function indentLine(i: number) {
    if (i === 0) return;
    const id = lines[i].id;
    setLines((L) => {
      const [x] = L.splice(i, 1);
      L[i - 1].children.push({ id: x.id, text: x.text, children: [] }, ...x.children);
      return L;
    });
    focusField(id);
  }
  function promoteSup(i: number, k: number) {
    if (lines.length >= MAX_KEY_LINES) return;
    const id = lines[i].children[k].id;
    setLines((L) => {
      const [y] = L[i].children.splice(k, 1);
      L.splice(i + 1, 0, { id: y.id, text: y.text, children: [] });
      return L;
    });
    focusField(id);
  }

  const lineKey = (i: number) => (e: KeyboardEvent) => {
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowLeft")) {
      e.preventDefault();
      moveLine(i, -1);
    } else if (e.altKey && (e.key === "ArrowDown" || e.key === "ArrowRight")) {
      e.preventDefault();
      moveLine(i, 1);
    } else if (e.key === "Tab" && !e.shiftKey && i > 0) {
      e.preventDefault();
      indentLine(i);
    }
  };
  const supKey = (i: number, k: number) => (e: KeyboardEvent) => {
    if (e.altKey && e.key === "ArrowUp") {
      e.preventDefault();
      moveSup(i, k, -1);
    } else if (e.altKey && e.key === "ArrowDown") {
      e.preventDefault();
      moveSup(i, k, 1);
    } else if (e.key === "Tab" && e.shiftKey && lines.length < MAX_KEY_LINES) {
      e.preventDefault();
      promoteSup(i, k);
    }
  };
  const handleKey = (i: number) => (e: KeyboardEvent) => {
    const d = e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = i + d;
    if (j < 0 || j >= lines.length) return;
    const id = lines[i].id;
    setLines((L) => {
      [L[i], L[j]] = [L[j], L[i]];
      return L;
    });
    setTimeout(() => document.querySelector<HTMLElement>(`[data-handle="${id}"]`)?.focus(), 0);
  };

  function drop(i: number, e: DragEvent) {
    e.preventDefault();
    const from = lines.findIndex((x) => x.id === drag);
    setDrag(null);
    if (from < 0 || from === i) return;
    setLines((L) => {
      const [x] = L.splice(from, 1);
      L.splice(i, 0, x);
      return L;
    });
  }

  const border = (id: string) => (pins[id] ? "border-accent" : "border-border");

  return (
    <div className="mx-auto flex min-w-[760px] flex-col items-center">
      <div className={`relative flex w-full max-w-[720px] flex-col gap-1.5 rounded-lg border bg-surface px-5 py-4 ${border(pyramid.id)}`}>
        <label htmlFor="pyr-gt" className="eyebrow">
          Governing thought
        </label>
        <textarea
          id="pyr-gt"
          data-field={pyramid.id}
          value={pyramid.text}
          onChange={(e) => onChange({ ...pyramid, text: e.target.value })}
          placeholder="State the answer to the client's question in one or two sentences."
          className="field-sizing-content min-h-14 resize-none bg-transparent p-0 font-serif text-xl leading-[1.35] font-semibold text-ink outline-none placeholder:text-faint"
        />
        {pins[pyramid.id] && <Pin n={pins[pyramid.id]} className="absolute -top-2.5 -right-2.5 border-2 border-bg" />}
      </div>
      <div className="h-5 w-px bg-border-strong" aria-hidden />
      <div className="relative w-full">
        {lines.length > 1 && (
          <div aria-hidden className="absolute top-0 h-px bg-border-strong" style={{ left: `calc(100% / ${n * 2})`, right: `calc(100% / ${n * 2})` }} />
        )}
        <ol className="m-0 grid list-none items-start gap-4 p-0" style={{ gridTemplateColumns: `repeat(${n}, minmax(170px, 1fr))` }}>
          {lines.map((kl, i) => (
            <li
              key={kl.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => drop(i, e)}
              className={`flex flex-col items-stretch ${drag === kl.id ? "opacity-40" : ""}`}
            >
              <div className="h-4 w-px self-center bg-border-strong" aria-hidden />
              <div className={`relative flex flex-col gap-1.5 rounded-lg border bg-surface px-3 pt-2.5 pb-3 ${border(kl.id)}`}>
                <div className="flex items-center gap-1">
                  <span
                    role="button"
                    tabIndex={0}
                    draggable
                    data-handle={kl.id}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", kl.id);
                      setDrag(kl.id);
                    }}
                    onDragEnd={() => setDrag(null)}
                    onKeyDown={handleKey(i)}
                    title="Drag to reorder"
                    aria-label={`Reorder key line ${i + 1}. Use arrow keys to move.`}
                    className="flex cursor-grab rounded text-faint hover:text-ink-2"
                  >
                    <GripVertical size={16} aria-hidden />
                  </span>
                  <label htmlFor={`pyr-${kl.id}`} className="text-xs font-semibold text-muted">
                    Key line {i + 1}
                  </label>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => {
                      setLines((L) => L.filter((_, j) => j !== i));
                      focusField(lines[i - 1]?.id ?? pyramid.id);
                    }}
                    aria-label={`Delete key line ${i + 1}`}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-faint hover:bg-hover hover:text-danger"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
                <textarea
                  id={`pyr-${kl.id}`}
                  data-field={kl.id}
                  value={kl.text}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLines((L) => {
                      L[i] = { ...L[i], text: v };
                      return L;
                    });
                  }}
                  onKeyDown={lineKey(i)}
                  placeholder="A reason to believe the answer"
                  className="field-sizing-content min-h-11 resize-none bg-transparent p-0 text-[15px] leading-[1.4] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-faint"
                />
                {pins[kl.id] && <Pin n={pins[kl.id]} className="absolute -top-2.5 -right-2.5 border-2 border-bg" />}
              </div>
              <div className="ml-3 flex flex-col gap-2 border-l border-border pt-2 pl-3.5">
                {kl.children.map((sp, k) => (
                  <div key={sp.id} className={`relative flex items-start gap-1.5 rounded-md border bg-surface py-2 pr-1.5 pl-2.5 ${border(sp.id)}`}>
                    <textarea
                      aria-label={`Key line ${i + 1}, supporting point ${k + 1}`}
                      data-field={sp.id}
                      value={sp.text}
                      onChange={(e) => {
                        const v = e.target.value;
                        setLines((L) => {
                          L[i].children[k] = { ...L[i].children[k], text: v };
                          return L;
                        });
                      }}
                      onKeyDown={supKey(i, k)}
                      placeholder="Evidence (cite the exhibit)"
                      className="field-sizing-content min-h-10 flex-1 resize-none bg-transparent p-0 text-[13px] leading-[1.45] text-ink-2 outline-none placeholder:text-faint"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLines((L) => {
                          L[i].children.splice(k, 1);
                          return L;
                        });
                        focusField(kl.children[k - 1]?.id ?? kl.id);
                      }}
                      aria-label={`Delete supporting point ${k + 1} of key line ${i + 1}`}
                      className="flex h-6 w-6 flex-none items-center justify-center rounded text-faint hover:text-danger"
                    >
                      <X size={14} aria-hidden />
                    </button>
                    {pins[sp.id] && <Pin small n={pins[sp.id]} className="absolute -top-[9px] -right-[9px] border-2 border-bg" />}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const id = uid("sp");
                    setLines((L) => {
                      L[i].children.push({ id, text: "", children: [] });
                      return L;
                    });
                    focusField(id);
                  }}
                  aria-label={`Add supporting point to key line ${i + 1}`}
                  className="flex h-7 items-center gap-1 self-start rounded-md px-2 text-[13px] text-primary hover:bg-primary-tint"
                >
                  <Plus size={14} aria-hidden />
                  Support
                </button>
              </div>
            </li>
          ))}
        </ol>
        {lines.length === 0 && (
          <p className="m-0 mt-4 text-center text-sm text-muted">Add 3–4 key lines: the reasons the CEO should believe your governing thought.</p>
        )}
      </div>
      <div className="mt-6 flex w-full max-w-[720px] items-center gap-4">
        <button
          type="button"
          onClick={() => {
            const id = uid("kl");
            setLines((L) => [...L, { id, text: "", children: [] }]);
            focusField(id);
          }}
          disabled={lines.length >= MAX_KEY_LINES}
          className="flex h-9 flex-none items-center gap-1.5 rounded-md border border-dashed border-border-strong px-3 text-sm text-primary hover:bg-primary-tint disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={16} aria-hidden />
          Key line
        </button>
        <span className="text-xs text-muted">
          Drag the handle or press Alt+↑/↓ to reorder · Tab indents a key line · Shift+Tab promotes a support
        </span>
      </div>
    </div>
  );
}
