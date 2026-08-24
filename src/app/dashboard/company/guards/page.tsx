"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";
import type { ShiftStatus } from "@/lib/types";

const emptyGuard = {
  name: "",
  employeeId: "",
  mobileNumber: "",
  assignedGateId: "",
  shiftLabel: "08:00 - 20:00",
  status: "active" as ShiftStatus
};

const emptyGate = {
  name: "",
  code: "",
  location: "",
  status: "active" as "active" | "inactive"
};

export default function CompanyGuardsPage() {
  const {
    currentCompany,
    currentCompanyGuards,
    currentCompanyGates,
    createGuard,
    updateGuard,
    deleteGuard,
    createGate,
    updateGate,
    deleteGate
  } = useLocalSystem();

  const [guardForm, setGuardForm] = useState(emptyGuard);
  const [editingGuardId, setEditingGuardId] = useState<string | null>(null);
  const [gateForm, setGateForm] = useState(emptyGate);
  const [editingGateId, setEditingGateId] = useState<string | null>(null);

  useEffect(() => {
    if (!guardForm.assignedGateId && currentCompanyGates[0]?.id) {
      setGuardForm((current) => ({ ...current, assignedGateId: currentCompanyGates[0].id }));
    }
  }, [currentCompanyGates, guardForm.assignedGateId]);

  function resetGuardForm() {
    setGuardForm({ ...emptyGuard, assignedGateId: currentCompanyGates[0]?.id ?? "" });
    setEditingGuardId(null);
  }

  function resetGateForm() {
    setGateForm(emptyGate);
    setEditingGateId(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <StatusPill tone="success">{editingGateId ? "Edit gate" : "Add gate"}</StatusPill>
        <h1 className="mt-3 text-2xl font-semibold text-white">Security gates CRUD</h1>
        <p className="mt-2 text-sm text-slate-400">Create, edit, activate/deactivate, and delete gates for {currentCompany?.name ?? "this company"}.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={gateForm.name} onChange={(e) => setGateForm((current) => ({ ...current, name: e.target.value }))} placeholder="Gate name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={gateForm.code} onChange={(e) => setGateForm((current) => ({ ...current, code: e.target.value }))} placeholder="Gate code" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={gateForm.location} onChange={(e) => setGateForm((current) => ({ ...current, location: e.target.value }))} placeholder="Location" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <select value={gateForm.status} onChange={(e) => setGateForm((current) => ({ ...current, status: e.target.value as "active" | "inactive" }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            <option value="active" className="bg-slate-950">Active</option>
            <option value="inactive" className="bg-slate-950">Inactive</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!currentCompany || !gateForm.name || !gateForm.code) return;
              if (editingGateId) {
                updateGate(editingGateId, gateForm);
              } else {
                createGate({ companyId: currentCompany.id, name: gateForm.name, code: gateForm.code, location: gateForm.location });
              }
              resetGateForm();
            }}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            {editingGateId ? "Save gate" : "Add gate"}
          </button>
          {editingGateId ? (
            <button type="button" onClick={resetGateForm} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Cancel
            </button>
          ) : null}
        </div>
        <div className="mt-5 space-y-3">
          {currentCompanyGates.map((gate) => (
            <div key={gate.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{gate.name}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {gate.code} • {gate.location || "No location"}
                  </div>
                </div>
                <StatusPill tone={gate.status === "active" ? "success" : "warning"}>{gate.status.toUpperCase()}</StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGateId(gate.id);
                    setGateForm({ name: gate.name, code: gate.code, location: gate.location, status: gate.status });
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete gate ${gate.name}?`)) deleteGate(gate.id);
                  }}
                  className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <StatusPill tone="success">{editingGuardId ? "Edit guard" : "Add guard"}</StatusPill>
        <h2 className="mt-3 text-2xl font-semibold text-white">Security guards CRUD</h2>
        <p className="mt-2 text-sm text-slate-400">Add, edit, activate, and remove company security staff.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={guardForm.name} onChange={(e) => setGuardForm((current) => ({ ...current, name: e.target.value }))} placeholder="Guard name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={guardForm.employeeId} onChange={(e) => setGuardForm((current) => ({ ...current, employeeId: e.target.value }))} placeholder="Employee ID" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={guardForm.mobileNumber} onChange={(e) => setGuardForm((current) => ({ ...current, mobileNumber: e.target.value }))} placeholder="Mobile number" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <select value={guardForm.assignedGateId} onChange={(e) => setGuardForm((current) => ({ ...current, assignedGateId: e.target.value }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGates.map((gate) => (
              <option key={gate.id} value={gate.id} className="bg-slate-950">
                {gate.name}
              </option>
            ))}
          </select>
          <input value={guardForm.shiftLabel} onChange={(e) => setGuardForm((current) => ({ ...current, shiftLabel: e.target.value }))} placeholder="Shift label" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <select value={guardForm.status} onChange={(e) => setGuardForm((current) => ({ ...current, status: e.target.value as ShiftStatus }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            <option value="active" className="bg-slate-950">Active</option>
            <option value="late" className="bg-slate-950">Late</option>
            <option value="offline" className="bg-slate-950">Offline</option>
            <option value="missed_verification" className="bg-slate-950">Missed verification</option>
            <option value="ended" className="bg-slate-950">Ended</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!currentCompany || !guardForm.name || !guardForm.employeeId || !guardForm.assignedGateId) return;
              if (editingGuardId) {
                updateGuard(editingGuardId, guardForm);
              } else {
                createGuard({
                  companyId: currentCompany.id,
                  name: guardForm.name,
                  employeeId: guardForm.employeeId,
                  mobileNumber: guardForm.mobileNumber,
                  assignedGateId: guardForm.assignedGateId,
                  shiftLabel: guardForm.shiftLabel
                });
              }
              resetGuardForm();
            }}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            {editingGuardId ? "Save guard" : "Add guard"}
          </button>
          {editingGuardId ? (
            <button type="button" onClick={resetGuardForm} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Cancel
            </button>
          ) : null}
        </div>
        <div className="mt-5 space-y-3">
          {currentCompanyGuards.map((guard) => (
            <div key={guard.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-white">{guard.name}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {guard.employeeId} • {guard.mobileNumber} • {guard.shiftLabel}
                  </div>
                </div>
                <StatusPill tone={guard.status === "active" ? "success" : guard.status === "missed_verification" ? "danger" : "warning"}>
                  {guard.status.replaceAll("_", " ").toUpperCase()}
                </StatusPill>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGuardId(guard.id);
                    setGuardForm({
                      name: guard.name,
                      employeeId: guard.employeeId,
                      mobileNumber: guard.mobileNumber,
                      assignedGateId: guard.assignedGateId,
                      shiftLabel: guard.shiftLabel,
                      status: guard.status
                    });
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete guard ${guard.name}?`)) deleteGuard(guard.id);
                  }}
                  className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
