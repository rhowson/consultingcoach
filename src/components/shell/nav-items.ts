import { BookOpen, ClipboardCheck, LayoutDashboard, PanelsTopLeft, PenLine, Settings, Target, TrendingUp } from "lucide-react";

type Group = "main" | "train" | "track" | "account";

export const NAV = [
  { href: "/", label: "Home", Icon: LayoutDashboard, mobile: true, group: "main" as Group },
  { href: "/learn", label: "Learn", Icon: BookOpen, mobile: true, group: "train" as Group },
  { href: "/practice", label: "Practice", Icon: Target, mobile: true, group: "train" as Group },
  { href: "/studio", label: "Storyboard Studio", Icon: PanelsTopLeft, mobile: false, group: "train" as Group },
  { href: "/red-pen", label: "Red Pen", Icon: PenLine, mobile: false, group: "train" as Group },
  { href: "/progress", label: "Progress", Icon: TrendingUp, mobile: true, group: "track" as Group },
  { href: "/settings", label: "Settings", Icon: Settings, mobile: false, group: "account" as Group },
] as const;

/** Only shown to assessors. */
export const ASSESSOR_NAV = { href: "/assess", label: "Assessments", Icon: ClipboardCheck, mobile: false, group: "track" as Group } as const;

export const NAV_GROUPS: { id: Group; label: string | null }[] = [
  { id: "main", label: null },
  { id: "train", label: "Train" },
  { id: "track", label: "Track" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFor(pathname: string) {
  if (pathname.startsWith("/feedback")) return "Feedback";
  if (isActive(pathname, ASSESSOR_NAV.href)) return ASSESSOR_NAV.label;
  return NAV.find((n) => isActive(pathname, n.href))?.label ?? "Consulting Coach";
}
