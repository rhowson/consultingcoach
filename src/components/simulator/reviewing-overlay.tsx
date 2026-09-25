"use client";

import { useEffect, useState } from "react";
import { LEVEL_LABELS, type Level } from "@/lib/competency";

/** Full-screen "Coach is reviewing…" state shown while the attempt is evaluated. */
export function ReviewingOverlay({ targetLevel }: { targetLevel: Level }) {
  const tips = [
    `Scoring every criterion against the ${LEVEL_LABELS[targetLevel]} bar.`,
    "Finding the turn that changed the conversation.",
    "Writing what to try instead, in words you could say.",
    "Updating your readiness.",
  ];
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTip((t) => (t + 1) % tips.length), 2200);
    return () => clearInterval(iv);
  }, [tips.length]);

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 flex items-center justify-center bg-bg p-6">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-5 text-center">
        <span className="font-serif text-2xl font-semibold">Coach is reviewing…</span>
        <div className="flex w-full flex-col gap-2.5" aria-hidden>
          {["100%", "86%", "64%"].map((w) => (
            <div key={w} className="cc-shimmer h-3 self-center rounded-md" style={{ width: w }} />
          ))}
        </div>
        <span className="min-h-[42px] text-sm text-muted">{tips[tip]}</span>
      </div>
    </div>
  );
}

/** Keyframes the simulator needs; React 19 hoists and dedupes this <style>. */
export function SimStyles() {
  return (
    <style href="cc-simulator" precedence="default">{`
@keyframes ccDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
@keyframes ccShimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
@keyframes ccFade{from{opacity:0;transform:translate(-50%,-4px)}to{opacity:1;transform:translate(-50%,0)}}
.cc-dot{animation:ccDot 1.2s infinite ease-in-out}
.cc-shimmer{background:linear-gradient(90deg,var(--hover) 0%,var(--surface) 50%,var(--hover) 100%);background-size:800px 100%;animation:ccShimmer 1.4s linear infinite}
.cc-toast{animation:ccFade 200ms ease-out}
`}</style>
  );
}
