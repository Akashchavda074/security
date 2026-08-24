import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { isRole, type Role } from "@/lib/roles";

const DEFAULT_ROLE: Role = "guard";

function readRole(): Role {
  const raw = process.env.NEXT_PUBLIC_DEFAULT_ROLE;
  return isRole(raw) ? raw : DEFAULT_ROLE;
}

export default function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return <AppShell role={readRole()}>{children}</AppShell>;
}
