import type { Ref } from "react";
import { PanelLeftClose, Target } from "lucide-react";
import type { Briefing } from "@/lib/types";

/** Left rail: the briefing. On desktop it can be collapsed to give the conversation more room. */
export function BriefingPanel({
  briefing,
  onCollapse,
  collapseRef,
  className = "",
}: {
  briefing: Briefing;
  onCollapse: () => void;
  collapseRef?: Ref<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-4 px-5 py-5 ${className}`}>
      <div className="hidden items-center justify-between lg:flex">
        <h2 className="eyebrow m-0">Briefing</h2>
        <button
          ref={collapseRef}
          type="button"
          onClick={onCollapse}
          aria-expanded
          aria-controls="sim-brief"
          aria-label="Hide briefing"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-transparent text-muted hover:bg-hover hover:text-ink"
        >
          <PanelLeftClose size={18} aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-4 text-sm leading-relaxed">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Situation</span>
          <span className="text-ink-2">{briefing.situation}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Your role</span>
          <span className="text-ink-2">{briefing.yourRole}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-md bg-subtle px-3.5 py-3">
          <span className="flex items-center gap-1.5 font-semibold">
            <Target size={16} className="text-primary" aria-hidden />
            Objective
          </span>
          <span className="text-ink">{briefing.objective}</span>
        </div>
      </div>
    </div>
  );
}
