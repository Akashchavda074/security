"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { calculateTimeInside } from "@/lib/local-system";
import { useLocalSystem } from "@/components/local-system-provider";

export default function GuardExitPage() {
  const { currentCompany, currentCompanyGates, currentCompanyGuards, activeEntries, recordVehicleExit } = useLocalSystem();
  const [vehicleEntryId, setVehicleEntryId] = useState(activeEntries[0]?.id ?? "");
  const [gateId, setGateId] = useState(currentCompanyGates[0]?.id ?? "");
  const [guardId, setGuardId] = useState(currentCompanyGuards[0]?.id ?? "");
  const [exitImageName, setExitImageName] = useState("");

  const selectedEntry = activeEntries.find((entry) => entry.id === vehicleEntryId);

  useEffect(() => {
    setVehicleEntryId(activeEntries[0]?.id ?? "");
    setGateId(currentCompanyGates[0]?.id ?? "");
    setGuardId(currentCompanyGuards[0]?.id ?? "");
  }, [activeEntries, currentCompanyGates, currentCompanyGuards]);

  return (
    <Card>
      <StatusPill tone="info">Vehicle exit</StatusPill>
      <h1 className="mt-3 text-2xl font-semibold text-white">Close an active entry</h1>
      <p className="mt-3 text-sm text-slate-400">Pick a vehicle currently inside, capture exit evidence if desired, and save the exit record locally.</p>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <select value={vehicleEntryId} onChange={(e) => setVehicleEntryId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {activeEntries.map((entry) => (
              <option key={entry.id} value={entry.id} className="bg-slate-950">
                {entry.correctedPlateNumber ?? entry.ocrPlateNumber} - {entry.timeInside}
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
          <select value={guardId} onChange={(e) => setGuardId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGuards.map((guard) => (
              <option key={guard.id} value={guard.id} className="bg-slate-950">
                {guard.name}
              </option>
            ))}
          </select>
          <label className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            Exit image
            <input type="file" accept="image/*" capture="environment" onChange={(e) => setExitImageName(e.target.files?.[0]?.name ?? "")} className="mt-2 block w-full text-sm text-slate-400" />
          </label>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-slate-400">Selected entry</div>
            <div className="mt-2 font-medium text-white">{selectedEntry ? selectedEntry.correctedPlateNumber ?? selectedEntry.ocrPlateNumber : "No active vehicle selected"}</div>
            <div className="mt-1 text-sm text-slate-400">{selectedEntry ? `${selectedEntry.driverName} • ${calculateTimeInside(selectedEntry.entryTime)}` : "Choose an active entry"}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!currentCompany || !vehicleEntryId || !gateId || !guardId) return;
              recordVehicleExit({ companyId: currentCompany.id, gateId, guardId, vehicleEntryId, exitImageName: exitImageName || undefined });
            }}
            className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Save vehicle exit
          </button>
        </div>
      </div>
    </Card>
  );
}
