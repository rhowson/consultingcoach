import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="signup" />;
}
