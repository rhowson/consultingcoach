import { LockKeyhole } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

/** Shown to signed-in users who aren't on the assessor list. */
export function NoAssessAccess() {
  return (
    <Card className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-6 py-12 text-center">
      <LockKeyhole size={28} className="text-faint" aria-hidden />
      <div className="flex flex-col gap-2">
        <CardTitle>You don&apos;t have access to assessments</CardTitle>
        <p className="m-0 text-sm text-muted">
          Interview assessments are only available to approved assessors. If you think you should have access, ask your administrator to add
          your email address to the assessor list.
        </p>
      </div>
      <ButtonLink href="/" variant="secondary" size="lg">
        Back to Home
      </ButtonLink>
    </Card>
  );
}
