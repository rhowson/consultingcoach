import type { Competency } from "@/lib/competency";

/** One colour per competency, from the level/semantic tokens, plus a dash pattern so lines differ beyond hue. */
export const SERIES: Record<Competency, { color: string; dash?: string; short: string }> = {
  problem_solving: { color: "var(--primary)", short: "Problem solving" },
  storyboarding: { color: "var(--level-consultant)", dash: "6 4", short: "Storyboarding" },
  client_management: { color: "var(--accent)", short: "Client mgmt" },
  difficult_conversations: { color: "var(--danger)", dash: "2 3", short: "Difficult convos" },
  output_quality: { color: "var(--level-analyst)", dash: "10 3 2 3", short: "Output quality" },
};
