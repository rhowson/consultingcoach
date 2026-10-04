import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/auth-form";
import { env } from "@/lib/env";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="signup" requiresAccessCode={!!env.SIGNUP_ACCESS_CODE} />;
}
