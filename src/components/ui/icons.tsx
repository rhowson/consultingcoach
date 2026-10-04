import { BadgeCheck, Brain, Handshake, MessagesSquare, Presentation, type LucideIcon, type LucideProps } from "lucide-react";
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

export type IconChipTone = "primary" | "accent" | "success" | "warning" | "danger" | "neutral";

const CHIP_TONE: Record<IconChipTone, string> = {
  primary: "bg-primary-tint text-primary",
  accent: "bg-accent-tint text-accent-ink",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning-ink",
  danger: "bg-danger-tint text-danger",
  neutral: "bg-hover text-ink-2",
};

const CHIP_SIZE = {
  sm: { box: "h-8 w-8", icon: 16 },
  md: { box: "h-10 w-10", icon: 20 },
} as const;

/** Small rounded square with a tinted background and a lucide icon. Decorative: pair it with a visible label. */
export function IconChip({
  Icon,
  tone = "primary",
  size = "md",
  className = "",
}: {
  Icon: LucideIcon;
  tone?: IconChipTone;
  size?: "sm" | "md";
  className?: string;
}) {
  const s = CHIP_SIZE[size];
  return (
    <span aria-hidden className={`inline-flex flex-none items-center justify-center rounded-md ${s.box} ${CHIP_TONE[tone]} ${className}`}>
      <Icon size={s.icon} strokeWidth={2} />
    </span>
  );
}
