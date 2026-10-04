"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Ellipsis, Flame, Info, Search } from "lucide-react";
import type { Level } from "@/lib/competency";
import { LEVEL_LABELS } from "@/lib/competency";
import { ReadinessPill } from "@/components/ui/badges";
import { UserAvatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { ASSESSOR_NAV, NAV, NAV_GROUPS, isActive, titleFor } from "./nav-items";

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
  const [moreOpen, setMoreOpen] = useState(false);
  const nav = data.isAssessor ? [...NAV, ASSESSOR_NAV] : [...NAV];

  // Close the mobile "More" menu on Escape (links close it on click).
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar (desktop) */}
      <nav aria-label="Primary" className="sticky top-0 hidden h-screen w-64 flex-none flex-col border-r border-border bg-surface px-4 py-5 lg:flex print:hidden">
        <Link href="/" className="px-2 pb-7 no-underline" aria-label="Consulting Coach home">
          <Logo variant="dark" />
        </Link>

        <div className="flex flex-col gap-5">
          {NAV_GROUPS.map((g) => {
            const items = nav.filter((n) => n.group === g.id);
            if (!items.length) return null;
            return (
              <div key={g.id} className="flex flex-col gap-0.5">
                {g.label && <div className="eyebrow px-3 pb-1.5 text-[11px] text-faint">{g.label}</div>}
                {items.map(({ href, label, Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm no-underline transition-colors ${
                        active ? "bg-primary-tint font-semibold text-primary" : "font-medium text-ink-2 hover:bg-hover hover:text-ink"
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.75} aria-hidden className={active ? "text-primary" : "text-muted group-hover:text-ink-2"} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          {/* Readiness mini-card: the one number that matters, always visible. */}
          <Link href="/progress" className="relative block overflow-hidden rounded-lg bg-linear-to-br from-primary to-sky-top p-4 text-white no-underline shadow-sm hover:shadow-md">
            <div className="text-xs font-medium text-white/80">Readiness for {LEVEL_LABELS[data.targetLevel]}</div>
            <div className="tabular mt-1 font-display text-3xl font-semibold tracking-tight">{data.readiness}%</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30" aria-hidden>
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.max(0, data.readiness))}%` }} />
            </div>
            <div className="mt-2.5 flex items-center gap-1 text-xs font-medium text-white/90">
              View progress <ChevronRight size={14} aria-hidden />
            </div>
          </Link>
          <Link
            href="/settings"
            aria-current={isActive(pathname, "/settings") ? "page" : undefined}
            className="flex items-center gap-2.5 rounded-md px-2 py-2 text-ink no-underline hover:bg-hover"
          >
            <UserAvatar name={data.name} size={36} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold">{data.name}</span>
              <span className="text-xs text-muted">{LEVEL_LABELS[data.currentLevel]} · Settings</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Sky band behind the page header; content cards overlap its lower edge. */}
        <div aria-hidden className="sky pointer-events-none absolute inset-x-0 top-0 h-56 [mask-image:linear-gradient(to_bottom,black_55%,transparent)] print:hidden" />

        <header className="relative z-10 flex h-20 items-center gap-3 px-4 md:px-8 print:hidden">
          <Link href="/" className="lg:hidden" aria-label="Consulting Coach home">
            <Logo variant="light" compact />
          </Link>
          {/* Home renders its own greeting as the page heading. */}
          {pathname !== "/" && (
            <h1 className="m-0 truncate font-display text-2xl font-semibold tracking-tight text-white drop-shadow-sm md:text-[28px]">{titleFor(pathname)}</h1>
          )}
          <div className="flex-1" />
          <Link
            href="/practice"
            aria-label="Search lessons and scenarios"
            className="glass hidden h-10 w-64 items-center gap-2 rounded-full pr-3 pl-4 text-sm text-muted no-underline shadow-sm hover:bg-surface xl:flex"
          >
            <Search size={16} aria-hidden />
            Search lessons, scenarios
          </Link>
          <div title={`${data.streakDays}-day streak`} className="glass tabular hidden h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold shadow-sm sm:flex">
            <Flame size={17} className="text-accent" aria-hidden />
            {data.streakDays}
            <span className="sr-only">day streak</span>
          </div>
          <div className="hidden md:block">
            <ReadinessPill from={data.currentLevel} to={data.targetLevel} percent={data.readiness} />
          </div>
          <Link href="/settings" className="rounded-full ring-2 ring-white/70" aria-label="Settings">
            <UserAvatar name={data.name} size={36} />
          </Link>
        </header>

        <main className="relative w-full max-w-[1280px] px-4 pt-2 pb-28 md:px-8 lg:pb-12">
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

      {/* Bottom tab bar (mobile) */}
      <nav aria-label="Primary" className="glass fixed inset-x-3 bottom-3 z-20 grid h-16 grid-cols-5 rounded-2xl shadow-lg lg:hidden print:hidden">
        {NAV.filter((n) => n.mobile).map(({ href, label, Icon }) => {
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
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          className="flex flex-col items-center justify-center gap-[3px] border-0 bg-transparent text-[11px] font-medium text-muted"
        >
          <Ellipsis size={21} strokeWidth={1.75} aria-hidden />
          More
        </button>
        {moreOpen && (
          <div role="menu" className="absolute right-0 bottom-[72px] flex w-60 flex-col rounded-lg border border-border bg-surface p-1.5 shadow-lg">
            {nav
              .filter((n) => !n.mobile)
              .map(({ href, label, Icon }) => (
                <Link key={href} role="menuitem" href={href} onClick={() => setMoreOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ink no-underline hover:bg-hover">
                  <Icon size={18} strokeWidth={1.75} className="text-muted" aria-hidden />
                  {label}
                </Link>
              ))}
          </div>
        )}
      </nav>
    </div>
  );
}
