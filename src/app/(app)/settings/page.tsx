import { Bot } from "lucide-react";
import { requirePageUser } from "@/lib/page-auth";
import { aiMockMode } from "@/lib/env";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { ProfileForm } from "@/components/settings/profile-form";
import { AccountActions } from "@/components/settings/account-actions";

export const metadata = { title: "Settings · Consulting Coach" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  return (
    <div className="flex max-w-[760px] flex-col gap-6">
      <Card aria-labelledby="profile-title" className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-0.5">
          <CardTitle id="profile-title">Profile and goals</CardTitle>
          <span className="text-sm text-muted">{user.email}</span>
        </div>
        <ProfileForm
          initial={{
            name: user.name,
            currentLevel: user.currentLevel,
            targetLevel: user.targetLevel,
            targetDate: user.targetDate,
            weeklyRepGoal: user.weeklyRepGoal,
            coachTone: user.coachTone,
          }}
        />
      </Card>

      <Card aria-labelledby="diag-title" className="flex flex-col gap-3 p-6">
        <CardTitle id="diag-title">Diagnostic</CardTitle>
        <p className="m-0 text-sm text-ink-2">
          Re-run the onboarding diagnostic to re-place yourself and regenerate your 4-week plan. Your rep history is kept.
        </p>
        <ButtonLink href="/onboarding" variant="secondary" className="self-start">
          Re-run diagnostic
        </ButtonLink>
      </Card>

      <Card className="flex items-center gap-3 p-5 text-sm">
        <Bot size={18} className="flex-none text-muted" aria-hidden />
        <span className="text-ink-2">
          AI coach: <b className="font-semibold">{aiMockMode ? "Demo mode" : "Live"}</b>
          <span className="text-muted">
            {aiMockMode ? " — responses are scripted because no model API key is configured." : " — responses come from the live model."}
          </span>
        </span>
      </Card>

      <AccountActions />
    </div>
  );
}
