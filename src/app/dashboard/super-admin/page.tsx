"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";

export default function SuperAdminPage() {
  const { state, totalCompanies, totalGuards, totalTodayEntries, totalOpenIncidents, createCompany, updateCompanyStatus, deleteCompany } = useLocalSystem();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [address, setAddress] = useState("");

  const stats = [
    { label: "Total Companies", value: String(totalCompanies), helper: `${state.companies.filter((company) => company.status === "active").length} active` },
    { label: "Total Guards", value: String(totalGuards), helper: "Across all companies" },
    { label: "Today Entries", value: String(totalTodayEntries), helper: "Local store records" },
    { label: "Open Incidents", value: String(totalOpenIncidents), helper: "Needs review" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <StatusPill tone="info">Super Admin</StatusPill>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">System overview</h1>
          <p className="mt-2 text-sm text-slate-400">Inspect companies, activate/suspend tenants, and create local test tenants.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-lg font-semibold text-white">Create company</h2>
          <p className="mt-2 text-sm text-slate-400">Quick create. Full edit/delete is on Companies.</p>
          <div className="mt-4 space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Company name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Company code" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="Contact info" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <button
              type="button"
              onClick={() => {
                if (!name || !code) return;
                createCompany({ name, code, contactInfo, address });
                setName("");
                setCode("");
                setContactInfo("");
                setAddress("");
              }}
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Save company
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Companies</h2>
          <div className="mt-4 space-y-3">
            {state.companies.map((company) => (
              <div key={company.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{company.name}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {company.code} • {company.contactInfo}
                    </div>
                  </div>
                  <StatusPill tone={company.status === "active" ? "success" : "danger"}>{company.status.toUpperCase()}</StatusPill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateCompanyStatus(company.id, company.status === "active" ? "suspended" : "active")}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
                  >
                    {company.status === "active" ? "Suspend" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete ${company.name}?`)) deleteCompany(company.id);
                    }}
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                  >
                    Delete
                  </button>
                  <a href="/dashboard/super-admin/companies" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-200">
                    Full CRUD
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
