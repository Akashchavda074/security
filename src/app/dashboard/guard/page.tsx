"use client";

import Link from "next/link";
import { CarFront, Fingerprint, MapPinned, Siren } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";

const actions = [
  { href: "/dashboard/guard/entry", title: "Vehicle Entry", icon: CarFront, text: "Capture plate, confirm OCR, and save entry." },
  { href: "/dashboard/guard/exit", title: "Vehicle Exit", icon: MapPinned, text: "Close an active visit and calculate time inside." },
  { href: "/dashboard/guard/verification", title: "Verification", icon: Fingerprint, text: "Record hourly guard verification evidence." },
  { href: "/dashboard/guard/incidents", title: "Incidents", icon: Siren, text: "Create an audit-friendly incident." }
] as const;

export default function GuardPage() {
  const { currentCompany, currentCompanyGuards, currentCompanyGates, activeEntries, missedVerifications, currentCompanyVerifications, currentCompanyIncidents } = useLocalSystem();
  const guard = currentCompanyGuards[0];
  const gate = currentCompanyGates.find((item) => item.id === guard?.assignedGateId) ?? currentCompanyGates[0];

  const stats = [
    { label: "Shift Status", value: guard?.status?.toUpperCase() ?? "ACTIVE", helper: guard?.shiftLabel ?? "No shift assigned" },
    { label: "Current Gate", value: gate?.name ?? "No gate", helper: gate?.location ?? "Unassigned" },
    { label: "Vehicles Inside", value: String(activeEntries.length), helper: "Monitor exits" },
    { label: "Missed Verification", value: String(missedVerifications), helper: `${currentCompanyVerifications.length} verifications recorded` }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
        <StatusPill tone="success">Guard Console</StatusPill>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{currentCompany?.name ?? "Security console"}</h1>
            <p className="mt-2 text-slate-200">Guard: {guard?.name ?? "Unassigned"}</p>
            <p className="mt-1 text-slate-300">Shift: {guard?.shiftLabel ?? "Not assigned"}</p>
            <p className="mt-1 text-slate-300">Gate: {gate?.name ?? "Not assigned"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-sm text-slate-400">Active entries</div>
            <div className="mt-2 text-3xl font-semibold text-white">{activeEntries.length}</div>
            <div className="mt-1 text-sm text-slate-300">Vehicles currently inside</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.title}>
              <Icon className="h-6 w-6 text-emerald-300" />
              <h2 className="mt-4 text-2xl font-semibold text-white">{action.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{action.text}</p>
              <Link href={action.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                Open workflow
              </Link>
            </Card>
          );
        })}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-white">Recent incidents</h2>
        <div className="mt-4 space-y-3">
          {currentCompanyIncidents.length ? (
            currentCompanyIncidents.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-white">{incident.title}</div>
                  <StatusPill tone={incident.severity === "critical" ? "danger" : incident.severity === "high" ? "warning" : "info"}>{incident.status.toUpperCase()}</StatusPill>
                </div>
                <div className="mt-2 text-sm text-slate-400">{incident.description}</div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No open incidents.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
