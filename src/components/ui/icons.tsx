import { BadgeCheck, Brain, Handshake, MessagesSquare, Presentation, type LucideProps } from "lucide-react";
import type { Competency } from "@/lib/competency";

export const COMPETENCY_ICON = {
  problem_solving: Brain,
  storyboarding: Presentation,
  client_management: Handshake,
  difficult_conversations: MessagesSquare,
  output_quality: BadgeCheck,
} as const;

export function CompetencyIcon({ competency, ...props }: { competency: Competency } & LucideProps) {
  const Icon = COMPETENCY_ICON[competency];
  return <Icon aria-hidden {...props} />;
}
