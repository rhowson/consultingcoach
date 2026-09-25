import { Angry, Frown, Meh, Smile } from "lucide-react";
import { MOODS, type Mood } from "@/lib/types";

/** Mix along the mood gradient (0 = --mood-from, 100 = --mood-to). */
export const moodMix = (pct: number) => `color-mix(in srgb, var(--mood-from), var(--mood-to) ${pct}%)`;

export const MOOD_META: Record<Mood, { label: string; Icon: typeof Smile; ink: string; ring: string }> = {
  calm: { label: "Calm", Icon: Smile, ink: "text-muted", ring: moodMix(30) },
  guarded: { label: "Guarded", Icon: Meh, ink: "text-warning-ink", ring: moodMix(50) },
  frustrated: { label: "Frustrated", Icon: Frown, ink: "text-danger", ring: moodMix(75) },
  escalating: { label: "Escalating", Icon: Angry, ink: "text-danger", ring: "var(--mood-to)" },
};

const GRADIENT = `linear-gradient(90deg, var(--mood-from), ${moodMix(35)} 35%, ${moodMix(70)} 70%, var(--mood-to))`;

/** MoodMeter: gradient track with a moving marker. The label is always shown so mood is never colour-only. */
export function MoodMeter({ mood }: { mood: Mood }) {
  const idx = MOODS.indexOf(mood);
  const m = MOOD_META[mood];
  const offset = idx === 0 ? " + 8px" : idx === MOODS.length - 1 ? " - 8px" : "";
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Client mood</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <m.Icon size={16} className={m.ink} aria-hidden />
          {m.label}
        </span>
      </div>
      <div
        role="meter"
        aria-label="Client mood"
        aria-valuemin={0}
        aria-valuemax={3}
        aria-valuenow={idx}
        aria-valuetext={m.label}
        className="relative h-2 rounded-full"
        style={{ background: GRADIENT }}
      >
        <div
          className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-ink bg-surface transition-[left] duration-200 ease-out"
          style={{ left: `calc(${(idx / (MOODS.length - 1)) * 100}%${offset})` }}
        />
      </div>
      <div className="grid grid-cols-4 text-[11px]" aria-hidden>
        {MOODS.map((md, i) => (
          <span
            key={md}
            className={`${i === 0 ? "text-left" : i === MOODS.length - 1 ? "text-right" : "text-center"} ${
              md === mood ? "font-semibold text-ink" : "text-muted"
            }`}
          >
            {MOOD_META[md].label}
          </span>
        ))}
      </div>
    </div>
  );
}
