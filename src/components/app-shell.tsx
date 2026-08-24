"use client";

import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { OnlineIndicator } from "@/components/online-indicator";
import { InstallPrompt } from "@/components/install-prompt";
import { PWARegister } from "@/components/pwa-register";
import { LocalSystemProvider, useLocalSystem } from "@/components/local-system-provider";
import { SystemToolbar } from "@/components/system-toolbar";
import { VerificationReminder } from "@/components/verification-reminder";
import type { Role } from "@/lib/roles";

function AppShellContent({ children, fallbackRole }: { children: ReactNode; fallbackRole: Role }) {
  const { state } = useLocalSystem();
  const activeRole = state.currentRole ?? fallbackRole;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] text-slate-100">
      <PWARegister />
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <AppSidebar role={activeRole} />
        </div>
        <main className="flex min-h-screen flex-col">
          <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 backdrop-blur xl:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Security operations</div>
                <div className="mt-1 text-lg font-semibold text-white">Multi-tenant local test console</div>
              </div>
              <div className="flex items-center gap-3">
                <OnlineIndicator />
                <InstallPrompt />
              </div>
            </div>
            <SystemToolbar />
          </header>
          <VerificationReminder />
          <div className="flex-1 p-4 xl:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({
  role,
  children
}: {
  role: Role;
  children: ReactNode;
}) {
  return (
    <LocalSystemProvider>
      <AppShellContent fallbackRole={role}>{children}</AppShellContent>
    </LocalSystemProvider>
  );
}
