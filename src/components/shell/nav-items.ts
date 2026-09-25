import { BookOpen, LayoutDashboard, PanelsTopLeft, PenLine, Settings, Target, TrendingUp } from "lucide-react";

export const NAV = [
  { href: "/", label: "Home", Icon: LayoutDashboard, mobile: true },
  { href: "/learn", label: "Learn", Icon: BookOpen, mobile: true },
  { href: "/practice", label: "Practice", Icon: Target, mobile: true },
  { href: "/studio", label: "Storyboard Studio", Icon: PanelsTopLeft, mobile: false },
  { href: "/red-pen", label: "Red Pen", Icon: PenLine, mobile: false },
  { href: "/progress", label: "Progress", Icon: TrendingUp, mobile: true },
  { href: "/settings", label: "Settings", Icon: Settings, mobile: false },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function titleFor(pathname: string) {
  if (pathname.startsWith("/feedback")) return "Feedback";
  return NAV.find((n) => isActive(pathname, n.href))?.label ?? "Consulting Coach";
}
