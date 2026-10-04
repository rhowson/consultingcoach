/** Technology & transformation practice areas every scenario belongs to. */
export const PRACTICE_AREAS = [
  "enterprise_technology",
  "data_ai",
  "programme_delivery",
  "change_culture",
  "commercial_advisory",
] as const;
export type PracticeArea = (typeof PRACTICE_AREAS)[number];

export const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  enterprise_technology: "Enterprise technology",
  data_ai: "Data & AI",
  programme_delivery: "Programme delivery",
  change_culture: "Change & culture",
  commercial_advisory: "Commercial advisory & decision support",
};

/** Short form for chips and filters. */
export const PRACTICE_AREA_SHORT: Record<PracticeArea, string> = {
  enterprise_technology: "Enterprise tech",
  data_ai: "Data & AI",
  programme_delivery: "Programme delivery",
  change_culture: "Change & culture",
  commercial_advisory: "Commercial & decisions",
};
