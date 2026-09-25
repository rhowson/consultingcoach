import { AppShell } from "@/components/shell/app-shell";
import { requirePageUser } from "@/lib/page-auth";
import { getShellData } from "@/lib/services/progress";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser();
  return <AppShell data={await getShellData(user)}>{children}</AppShell>;
}
