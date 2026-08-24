"use client";

import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";
import { ArrowRight, Building2, CarFront, Fingerprint, Gauge } from "lucide-react";
import Link from "next/link";

const entryPoints = [
  { href: "/dashboard/super-admin", title: "Super Admin", text: "Companies, status control, and audit visibility.", icon: Building2 },
  { href: "/dashboard/company", title: "Company Admin", text: "Manage gates, guards, vehicles, and alerts.", icon: Gauge },
  { href: "/dashboard/guard", title: "Guard Console", text: "Entry, exit, verification, and incidents.", icon: CarFront },
  { href: "/dashboard/guard/verification", title: "Verification", text: "Hourly guard verification flow.", icon: Fingerprint }
] as const;

export default function DashboardIndexPage() {
  const { currentCompany, activeEntries, missedVerifications, totalCompanies, totalGuards, totalTodayEntries, totalOpenIncidents, currentCompanyAlerts } = useLocalSystem();

  const stats = [
    { label: "Companies", value: String(totalCompanies), helper: "Local tenants loaded" },
    { label: "Guards", value: String(totalGuards), helper: "Across all companies" },
    { label: "Today's Entries", value: String(totalTodayEntries), helper: `${activeEntries.length} vehicles still inside` },
    { label: "Open Incidents", value: String(totalOpenIncidents), helper: `${missedVerifications} guards missed verification` }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <StatusPill tone="info">Local system overview</StatusPill>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{currentCompany?.name ?? "Security system"}</h1>
          <p className="mt-2 text-sm text-slate-400">Use the role switcher and company picker above to inspect the system without authentication.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Current inside</h2>
            <Link href="/dashboard/guard/exit" className="text-sm font-semibold text-emerald-300">
              Exit workflow
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {activeEntries.length ? (
              activeEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{entry.correctedPlateNumber ?? entry.ocrPlateNumber}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {entry.driverName} • {entry.purpose}
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      <div>{entry.timeInside}</div>
                      <div className="mt-1 text-xs text-emerald-300">INSIDE</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No vehicles currently inside this company.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Recent alerts</h2>
          <div className="mt-4 space-y-3">
            {currentCompanyAlerts.length ? (
              currentCompanyAlerts.slice(0, 4).map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">{alert.title}</div>
                    <StatusPill tone={alert.severity === "critical" ? "danger" : alert.severity === "high" ? "warning" : "info"}>{alert.severity.toUpperCase()}</StatusPill>
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{alert.detail}</div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-slate-400">No alerts for this company.</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {entryPoints.map((entry) => {
          const Icon = entry.icon;
          return (
            <Card key={entry.title}>
              <Icon className="h-6 w-6 text-emerald-300" />
              <h3 className="mt-4 text-xl font-semibold text-white">{entry.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{entry.text}</p>
              <Link href={entry.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                Open section <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
