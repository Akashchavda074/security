"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";

export default function GuardIncidentsPage() {
  const { currentCompany, currentCompanyGuards, currentCompanyGates, currentCompanyIncidents, createIncident, acknowledgeIncident, closeIncident } = useLocalSystem();
  const [guardId, setGuardId] = useState(currentCompanyGuards[0]?.id ?? "");
  const [gateId, setGateId] = useState(currentCompanyGates[0]?.id ?? "");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setGuardId(currentCompanyGuards[0]?.id ?? "");
    setGateId(currentCompanyGates[0]?.id ?? "");
  }, [currentCompanyGates, currentCompanyGuards]);

  return (
    <Card>
      <StatusPill tone="danger">Incident reporting</StatusPill>
      <h1 className="mt-3 text-2xl font-semibold text-white">Create a security incident</h1>
      <p className="mt-3 text-sm text-slate-400">Use this local form to test incident capture, severity, audit trail, and lifecycle controls.</p>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <select value={guardId} onChange={(e) => setGuardId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGuards.map((guard) => (
              <option key={guard.id} value={guard.id} className="bg-slate-950">
                {guard.name}
              </option>
            ))}
          </select>
          <select value={gateId} onChange={(e) => setGateId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGates.map((gate) => (
              <option key={gate.id} value={gate.id} className="bg-slate-950">
                {gate.name}
              </option>
            ))}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            <option value="low" className="bg-slate-950">Low</option>
            <option value="medium" className="bg-slate-950">Medium</option>
            <option value="high" className="bg-slate-950">High</option>
            <option value="critical" className="bg-slate-950">Critical</option>
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Incident description" className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <button
            type="button"
            onClick={() => {
              if (!currentCompany || !title || !description) return;
              createIncident({ companyId: currentCompany.id, gateId, guardId, severity, title, description });
              setTitle("");
              setDescription("");
            }}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Save incident
          </button>
        </div>

        <div className="space-y-3">
          {currentCompanyIncidents.map((incident) => (
            <div key={incident.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-white">{incident.title}</div>
                <StatusPill tone={incident.severity === "critical" ? "danger" : incident.severity === "high" ? "warning" : "info"}>{incident.status.toUpperCase()}</StatusPill>
              </div>
              <div className="mt-2 text-sm text-slate-400">{incident.description}</div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => acknowledgeIncident(incident.id)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">
                  Acknowledge
                </button>
                <button type="button" onClick={() => closeIncident(incident.id)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
