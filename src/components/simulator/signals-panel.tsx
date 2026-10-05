import type { Mood } from "@/lib/types";
import { PersonaAvatar } from "@/components/ui/avatar";
import { MOOD_META, MoodMeter } from "./mood-meter";
import { ObjectiveChecklist, type ObjectiveState } from "./objective-checklist";

/** Right rail: who you're talking to, their mood, and the objectives. */
export function SignalsPanel({
  persona,
  mood,
  objectives,
}: {
  persona: { id: string; name: string; title: string; company: string };
  mood: Mood;
  objectives: ObjectiveState[];
}) {
  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <div className="flex items-center gap-3">
        <PersonaAvatar id={persona.id} name={persona.name} size={44} ring={MOOD_META[mood].ring} />
        <div className="flex min-w-0 flex-col leading-snug">
          <span className="text-[15px] font-semibold">{persona.name}</span>
          <span className="text-[13px] text-muted">
            {persona.title}
            {persona.company ? `, ${persona.company}` : ""}
          </span>
        </div>
      </div>
      <MoodMeter mood={mood} />
      {objectives.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <h2 className="eyebrow m-0">Objectives</h2>
          <ObjectiveChecklist objectives={objectives} />
        </div>
      )}
    </div>
  );
}
