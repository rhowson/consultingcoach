import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return <AuthForm mode="login" />;
}
