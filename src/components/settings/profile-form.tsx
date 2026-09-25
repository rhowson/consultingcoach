"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, CircleAlert } from "lucide-react";
import { api, ApiError } from "@/lib/client/api";
import { LEVELS, LEVEL_LABELS, nextLevel, type Level } from "@/lib/competency";
import { Button } from "@/components/ui/button";

type Tone = "supportive" | "direct" | "partner";
export interface ProfileValues {
  name: string;
  currentLevel: Level;
  targetLevel: Level | null;
  targetDate: string | null;
  weeklyRepGoal: number;
  coachTone: Tone;
}

const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "supportive", label: "Supportive", hint: "Encouraging; leads with what went well." },
  { value: "direct", label: "Direct", hint: "Straight to the gaps, still constructive." },
  { value: "partner", label: "Partner-brutal", hint: "How a demanding partner marks it up the night before." },
];

const field =
  "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary aria-[invalid=true]:border-danger";

export function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof ProfileValues>(k: K, val: ProfileValues[K]) => {
    setV((p) => ({ ...p, [k]: val }));
    setStatus("idle");
  };
  const goalValid = Number.isInteger(v.weeklyRepGoal) && v.weeklyRepGoal >= 1 && v.weeklyRepGoal <= 21;
  const nameValid = v.name.trim().length > 0;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!goalValid || !nameValid) return;
    setStatus("saving");
    setError(null);
    try {
      await api.me.update({ ...v, name: v.name.trim(), targetDate: v.targetDate || null });
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your changes.");
      setStatus("idle");
    }
  }

  const defaultTarget = nextLevel(v.currentLevel);

  return (
    <form onSubmit={save} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-name" className="text-sm font-medium">
          Name
        </label>
        <input id="s-name" className={field} value={v.name} maxLength={100} autoComplete="name" aria-invalid={!nameValid} onChange={(e) => set("name", e.target.value)} />
        {!nameValid && <span className="text-[13px] text-danger">Name can&apos;t be empty.</span>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="s-current" className="text-sm font-medium">
            Current level
          </label>
          <select id="s-current" className={field} value={v.currentLevel} onChange={(e) => set("currentLevel", e.target.value as Level)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="s-target" className="text-sm font-medium">
            Target level
          </label>
          <select id="s-target" className={field} value={v.targetLevel ?? ""} onChange={(e) => set("targetLevel", (e.target.value || null) as Level | null)}>
            <option value="">Next level{defaultTarget ? ` (${LEVEL_LABELS[defaultTarget]})` : ""}</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="s-date" className="text-sm font-medium">
            Target date <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="s-date" type="date" className={field} value={v.targetDate ?? ""} onChange={(e) => set("targetDate", e.target.value || null)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="s-goal" className="text-sm font-medium">
            Weekly rep goal
          </label>
          <input
            id="s-goal"
            type="number"
            inputMode="numeric"
            min={1}
            max={21}
            className={field}
            value={Number.isNaN(v.weeklyRepGoal) ? "" : v.weeklyRepGoal}
            aria-invalid={!goalValid}
            aria-describedby="s-goal-hint"
            onChange={(e) => set("weeklyRepGoal", e.target.valueAsNumber)}
          />
          <span id="s-goal-hint" className={`flex items-center gap-1 text-[13px] ${goalValid ? "text-muted" : "text-danger"}`}>
            {!goalValid && <CircleAlert size={14} aria-hidden />}
            Between 1 and 21 reps a week.
          </span>
        </div>
      </div>

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-2 text-sm font-medium">Coach tone</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TONES.map((t) => (
            <label
              key={t.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-md border p-3.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                v.coachTone === t.value ? "border-primary bg-primary-tint" : "border-border bg-surface hover:bg-hover"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <input type="radio" name="tone" value={t.value} checked={v.coachTone === t.value} onChange={() => set("coachTone", t.value)} className="accent-[var(--primary)]" />
                {t.label}
              </span>
              <span className="text-[13px] text-muted">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="m-0 flex items-center gap-1.5 text-sm text-danger">
          <CircleAlert size={16} aria-hidden /> {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving" || !goalValid || !nameValid}>
          {status === "saving" ? "Saving…" : "Save changes"}
        </Button>
        <span role="status" className="flex items-center gap-1 text-sm text-success">
          {status === "saved" && (
            <>
              <Check size={15} aria-hidden /> Saved
            </>
          )}
        </span>
      </div>
    </form>
  );
}
