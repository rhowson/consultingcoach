import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/** For server pages: the signed-in, onboarded user, or a redirect to login/onboarding. */
export async function requirePageUser({ allowNotOnboarded = false } = {}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!allowNotOnboarded && !user.onboardedAt) redirect("/onboarding");
  return user;
}
