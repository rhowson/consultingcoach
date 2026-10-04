import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { IconChip, type IconChipTone } from "@/components/ui/icons";

/** Consistent dashboard card header: icon chip, title (+ optional subtitle) and an optional "View all →" link. */
export function SectionHeader({
  id,
  Icon,
  tone = "primary",
  title,
  subtitle,
  href,
  linkLabel = "View all",
}: {
  id: string;
  Icon: LucideIcon;
  tone?: IconChipTone;
  title: string;
  subtitle?: string | null;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <IconChip Icon={Icon} tone={tone} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <h2 id={id} className="m-0 font-display text-lg leading-8 font-semibold tracking-tight">
          {title}
        </h2>
        {subtitle && <p className="m-0 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          aria-label={`${linkLabel}: ${title}`}
          className="group inline-flex h-8 flex-none items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-primary no-underline transition-colors hover:bg-primary-tint"
        >
          {linkLabel}
          <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
