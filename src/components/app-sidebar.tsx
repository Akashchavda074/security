"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Shield, Building2, CarFront, Fingerprint, LayoutDashboard, LogOut, Siren, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { roleLabel, type Role } from "@/lib/roles";
import { DEMO_SESSION_KEY } from "@/lib/demo-auth";

const roleNavigation: Record<Role, { href: Route; label: string; icon: ReactNode }[]> = {
  super_admin: [
    { href: "/dashboard/super-admin", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/dashboard/super-admin/companies", label: "Companies", icon: <Building2 className="h-4 w-4" /> },
    { href: "/dashboard/super-admin/audit", label: "Audit Logs", icon: <Shield className="h-4 w-4" /> }
  ],
  company_admin: [
    { href: "/dashboard/company", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/dashboard/company/guards", label: "Security CRUD", icon: <Users className="h-4 w-4" /> },
    { href: "/dashboard/company/vehicles", label: "Vehicles", icon: <CarFront className="h-4 w-4" /> }
  ],
  guard: [
    { href: "/dashboard/guard", label: "Shift Console", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/dashboard/guard/entry", label: "Vehicle Entry", icon: <CarFront className="h-4 w-4" /> },
    { href: "/dashboard/guard/verification", label: "Verification", icon: <Fingerprint className="h-4 w-4" /> },
    { href: "/dashboard/guard/incidents", label: "Incidents", icon: <Siren className="h-4 w-4" /> }
  ]
};

export function AppSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = roleNavigation[role];

  return (
    <aside className="flex h-full flex-col gap-6 border-r border-white/10 bg-slate-950/80 p-5 backdrop-blur-xl">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">Security PWA</div>
        <div className="mt-2 text-xl font-semibold text-white">{roleLabel(role)}</div>
        <div className="mt-1 text-sm text-slate-400">Multi-company secure operations</div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/20" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <span className={cn("shrink-0", active ? "text-emerald-300" : "text-slate-500")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Session</div>
        <div className="mt-2 text-sm text-slate-200">Signed in on a tracked device</div>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem(DEMO_SESSION_KEY);
            router.push("/login");
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
