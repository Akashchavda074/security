"use client";

import { useLocalSystem } from "@/components/local-system-provider";
import { StatusPill } from "@/components/ui/status-pill";
import { roleLabel, ROLES } from "@/lib/roles";

export function SystemToolbar() {
  const { state, currentCompany, setCurrentCompanyId, setCurrentRole, totalCompanies, totalGuards, totalTodayEntries, totalOpenIncidents } = useLocalSystem();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="info">Local running mode</StatusPill>
        <StatusPill tone={state.currentRole === "guard" ? "success" : state.currentRole === "company_admin" ? "warning" : "info"}>
          {roleLabel(state.currentRole)}
        </StatusPill>
      </div>

      <select
        value={state.currentRole}
        onChange={(event) => setCurrentRole(event.target.value as typeof state.currentRole)}
        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
      >
        {ROLES.map((role) => (
          <option key={role} value={role} className="bg-slate-950">
            {roleLabel(role)}
          </option>
        ))}
      </select>

      <select
        value={currentCompany?.id}
        onChange={(event) => setCurrentCompanyId(event.target.value)}
        className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
      >
        {state.companies.map((company) => (
          <option key={company.id} value={company.id} className="bg-slate-950">
            {company.name}
          </option>
        ))}
      </select>

      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
        <span>{totalCompanies} companies</span>
        <span>•</span>
        <span>{totalGuards} guards</span>
        <span>•</span>
        <span>{totalTodayEntries} entries</span>
        <span>•</span>
        <span>{totalOpenIncidents} open incidents</span>
      </div>
    </div>
  );
}
