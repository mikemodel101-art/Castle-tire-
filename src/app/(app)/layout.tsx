import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { SESSION_COOKIE, memberForEmail } from "@/lib/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const member = memberForEmail(jar.get(SESSION_COOKIE)?.value);
  if (!member) redirect("/login");

  return (
    <AppShell user={{ id: member.id, name: member.name, role: member.role, initials: member.initials }}>
      {children}
    </AppShell>
  );
}
