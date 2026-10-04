import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAssessorEmail } from "@/lib/env";

/**
 * For server pages: the signed-in, onboarded user, or a redirect to login/onboarding.
 * `allowAssessor` lets assessors who never did the coaching onboarding reach assessor pages.
 */
export async function requirePageUser({ allowNotOnboarded = false, allowAssessor = false } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowNotOnboarded && !user.onboardedAt && !(allowAssessor && isAssessorEmail(user.email))) redirect("/onboarding");
  return user;
}
