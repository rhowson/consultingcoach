"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import type { Level } from "@/lib/competency";
import { LEVEL_LABELS } from "@/lib/competency";
import { UserAvatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { ASSESSOR_NAV, NAV, isActive, titleFor } from "./nav-items";

export interface ShellData {
  name: string;
  currentLevel: Level;
  targetLevel: Level;
  readiness: number;
  streakDays: number;
  aiMode: "live" | "mock" | "off";
  isAssessor: boolean;
}

export function AppShell({ data, children }: { data: ShellData; children: React.ReactNode }) {
  const pathname = usePathname();
  const nav = data.isAssessor ? [...NAV, ASSESSOR_NAV] : [...NAV];

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar (desktop) */}
      <nav aria-label="Primary" className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-border bg-surface px-4 py-5 lg:flex print:hidden">
        <Link href="/" className="px-2 pb-8 no-underline" aria-label="Consulting Coach home">
          <Logo variant="dark" />
        </Link>

        <div className="flex flex-col gap-1">
          {nav.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-[15px] no-underline transition-colors ${
                  active ? "bg-primary-tint font-semibold text-primary" : "font-medium text-ink-2 hover:bg-hover hover:text-ink"
                }`}
              >
                <Icon size={19} strokeWidth={1.75} aria-hidden className={active ? "text-primary" : "text-muted group-hover:text-ink-2"} />
                {label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/settings"
          aria-current={isActive(pathname, "/settings") ? "page" : undefined}
          className="mt-auto flex items-center gap-2.5 rounded-md px-2 py-2 text-ink no-underline hover:bg-hover"
        >
          <UserAvatar name={data.name} size={36} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{data.name}</span>
            <span className="text-xs text-muted">{LEVEL_LABELS[data.currentLevel]} · Settings</span>
          </span>
        </Link>
      </nav>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Soft sky band behind the page header. */}
        <div aria-hidden className="sky pointer-events-none absolute inset-x-0 top-0 h-44 [mask-image:linear-gradient(to_bottom,black_45%,transparent)] print:hidden" />

        <header className="relative z-10 flex h-20 items-center gap-3 px-4 md:px-8 print:hidden">
          <Link href="/" className="lg:hidden" aria-label="Consulting Coach home">
            <Logo variant="light" compact />
          </Link>
          {/* Home renders its own greeting as the page heading. */}
          {pathname !== "/" && (
            <h1 className="m-0 truncate font-display text-2xl font-semibold tracking-tight text-white drop-shadow-sm md:text-[28px]">{titleFor(pathname)}</h1>
          )}
          <div className="flex-1" />
          <Link href="/settings" className="rounded-full ring-2 ring-white/70 lg:hidden" aria-label="Settings">
            <UserAvatar name={data.name} size={36} />
          </Link>
        </header>

        <main className="relative w-full max-w-[1200px] px-4 pt-2 pb-28 md:px-8 lg:pb-12">
          {data.aiMode !== "live" && (
            <div role="status" className="glass mb-6 flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm text-ink shadow-sm print:hidden">
              <Info size={18} className="mt-px flex-none text-warning" aria-hidden />
              {data.aiMode === "mock"
                ? "Practice mode: AI replies and scores are simulated and don't reflect real performance."
                : "The AI coach isn't configured yet, so reps can't be started or scored. An administrator needs to add the Claude API key."}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Bottom tab bar (mobile): the same five jobs. */}
      <nav
        aria-label="Primary"
        className="glass fixed inset-x-3 bottom-3 z-20 grid h-16 rounded-2xl shadow-lg lg:hidden print:hidden"
        style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
      >
        {nav.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-[3px] text-[11px] no-underline ${active ? "font-semibold text-primary" : "font-medium text-muted"}`}
            >
              <Icon size={21} strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
