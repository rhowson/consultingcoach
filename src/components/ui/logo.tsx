import { MessagesSquare } from "lucide-react";

type LogoProps = {
  /** "dark" = ink wordmark for light surfaces; "light" = white wordmark for use over the sky. */
  variant?: "dark" | "light";
  /** Icon mark only. The parent link/button supplies the accessible name. */
  compact?: boolean;
  /** Mark size: md (32px) for headers, lg (40px) for hero/auth panels. */
  size?: "md" | "lg";
  className?: string;
};

/** Consulting Coach brand mark: a sky-gradient tile with a white speech icon, plus the wordmark. */
export function Logo({ variant = "dark", compact = false, size = "md", className = "" }: LogoProps) {
  const tile = size === "lg" ? "h-10 w-10 rounded-[12px]" : "h-8 w-8 rounded-[10px]";
  const icon = size === "lg" ? 20 : 17;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden
        className={`relative flex shrink-0 items-center justify-center bg-linear-to-br from-sky-mid via-sky-top to-primary text-white shadow-sm ring-1 ring-white/30 ${tile}`}
      >
        <MessagesSquare size={icon} strokeWidth={2.1} aria-hidden />
      </span>
      {!compact && (
        <span
          className={`font-display leading-none font-semibold tracking-tight whitespace-nowrap ${size === "lg" ? "text-xl" : "text-[17px]"} ${
            variant === "light" ? "text-white" : "text-ink"
          }`}
        >
          Consulting Coach
        </span>
      )}
    </span>
  );
}
