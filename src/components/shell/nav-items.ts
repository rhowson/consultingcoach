import { BookOpen, ClipboardCheck, LayoutDashboard, PenLine, Target, TrendingUp } from "lucide-react";

/** Five jobs, in the order people do them. Settings lives under the avatar. */
export const NAV = [
  { href: "/", label: "Home", Icon: LayoutDashboard },
  { href: "/practice", label: "Practice", Icon: Target },
  { href: "/learn", label: "Learn", Icon: BookOpen },
  { href: "/red-pen", label: "Review", Icon: PenLine },
  { href: "/progress", label: "Progress", Icon: TrendingUp },
] as const;

/** Only shown to assessors. */
export const ASSESSOR_NAV = { href: "/assess", label: "Assessments", Icon: ClipboardCheck } as const;

const TITLES: [string, string][] = [
  ["/red-pen", "Partner review"],
  ["/feedback", "Feedback"],
  ["/settings", "Settings"],
  ["/assess", "Assessments"],
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFor(pathname: string) {
  const special = TITLES.find(([href]) => isActive(pathname, href));
  if (special) return special[1];
  return NAV.find((n) => isActive(pathname, n.href))?.label ?? "Consulting Coach";
}
