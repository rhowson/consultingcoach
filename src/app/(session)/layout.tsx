import { requirePageUser } from "@/lib/page-auth";

/** Full-screen session mode (Simulator, Studio, Rehearsal): no sidebar, just the session header. */
export default async function SessionLayout({ children }: { children: React.ReactNode }) {
  await requirePageUser();
  return <div className="flex min-h-screen flex-col bg-surface">{children}</div>;
}
