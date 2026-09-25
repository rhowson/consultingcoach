import Link from "next/link";
import { X } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { OnboardingWizard } from "@/components/onboarding/wizard";

export const metadata = { title: "Diagnostic · Consulting Coach" };

export default async function OnboardingPage() {
  const user = await requirePageUser({ allowNotOnboarded: true });
  const rerun = !!user.onboardedAt;
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-16 items-center gap-3 border-b border-border px-4 md:px-8">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary font-serif text-base font-semibold text-on-primary" aria-hidden>
          C
        </span>
        <span className="font-serif text-lg font-semibold tracking-tight">Consulting Coach</span>
        <span className="flex-1" />
        {rerun && (
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-ink-2 no-underline hover:bg-hover">
            <X size={16} aria-hidden /> Exit
          </Link>
        )}
      </header>
      <main className="mx-auto w-full max-w-[760px] px-4 pt-8 pb-16 md:px-8">
        <OnboardingWizard
          name={user.name}
          initial={{ currentLevel: user.currentLevel, targetLevel: user.targetLevel, goal: user.goal, targetDate: user.targetDate }}
          rerun={rerun}
        />
      </main>
    </div>
  );
}
