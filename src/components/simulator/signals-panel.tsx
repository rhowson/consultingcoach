import type { Mood } from "@/lib/types";
import { PersonaAvatar } from "@/components/ui/avatar";
import { MOOD_META, MoodMeter } from "./mood-meter";
import { ObjectiveChecklist, type ObjectiveState } from "./objective-checklist";

/** Right panel: persona card with mood ring, MoodMeter, turn counter, objectives. */
export function SignalsPanel({
  persona,
  mood,
  turn,
  maxTurns,
  objectives,
}: {
  persona: { id: string; name: string; title: string; company: string };
  mood: Mood;
  turn: number;
  maxTurns: number;
  objectives: ObjectiveState[];
}) {
  return (
    <div className="flex flex-col gap-7 px-5 py-6">
      <div className="flex items-center gap-3">
        <span className="rounded-[10px] transition-shadow duration-200">
          <PersonaAvatar id={persona.id} name={persona.name} size={48} ring={MOOD_META[mood].ring} />
        </span>
        <div className="flex min-w-0 flex-col leading-snug">
          <span className="text-[15px] font-semibold">{persona.name}</span>
          <span className="text-[13px] text-muted">
            {persona.title}
            {persona.company ? `, ${persona.company}` : ""}
          </span>
        </div>
      </div>
      <MoodMeter mood={mood} />
      <div className="flex items-baseline justify-between border-t border-border pt-5">
        <span className="eyebrow">Turn</span>
        <span className="tabular">
          <span className="text-2xl font-semibold">{turn}</span>
          <span className="text-sm text-muted"> of about {maxTurns}</span>
        </span>
      </div>
      {objectives.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <span className="eyebrow">Objectives</span>
          <ObjectiveChecklist objectives={objectives} />
        </div>
      )}
    </div>
  );
}
