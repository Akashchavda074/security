"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";
import type { VehicleStatus } from "@/lib/types";

const emptyVehicle = {
  vehicleNumber: "",
  vehicleType: "Car",
  ownerName: "",
  driverName: "",
  authorizationStatus: "authorized" as VehicleStatus,
  notes: ""
};

export default function CompanyVehiclesPage() {
  const { currentCompany, currentCompanyVehicles, activeEntries, createVehicle, updateVehicle, deleteVehicle } = useLocalSystem();
  const [form, setForm] = useState(emptyVehicle);
  const [editingId, setEditingId] = useState<string | null>(null);

  function resetForm() {
    setForm(emptyVehicle);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <Card>
        <StatusPill tone="info">{editingId ? "Edit vehicle" : "Add vehicle"}</StatusPill>
        <h1 className="mt-3 text-2xl font-semibold text-white">Vehicle CRUD</h1>
        <p className="mt-2 text-sm text-slate-400">Register, update authorization status, watchlist, and remove vehicles.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={form.vehicleNumber} onChange={(e) => setForm((current) => ({ ...current, vehicleNumber: e.target.value.toUpperCase() }))} placeholder="Vehicle number" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={form.vehicleType} onChange={(e) => setForm((current) => ({ ...current, vehicleType: e.target.value }))} placeholder="Vehicle type" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={form.ownerName} onChange={(e) => setForm((current) => ({ ...current, ownerName: e.target.value }))} placeholder="Owner name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={form.driverName} onChange={(e) => setForm((current) => ({ ...current, driverName: e.target.value }))} placeholder="Driver name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <select value={form.authorizationStatus} onChange={(e) => setForm((current) => ({ ...current, authorizationStatus: e.target.value as VehicleStatus }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            <option value="authorized" className="bg-slate-950">Authorized</option>
            <option value="expired" className="bg-slate-950">Expired</option>
            <option value="unknown" className="bg-slate-950">Unknown</option>
            <option value="watchlist" className="bg-slate-950">Watchlist</option>
          </select>
          <input value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Notes" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!currentCompany || !form.vehicleNumber || !form.vehicleType) return;
              if (editingId) {
                updateVehicle(editingId, form);
              } else {
                createVehicle({ companyId: currentCompany.id, ...form });
              }
              resetForm();
            }}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            {editingId ? "Save vehicle" : "Add vehicle"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Cancel
            </button>
          ) : null}
        </div>
      </Card>

      <Card>
        <StatusPill tone="info">Vehicle list</StatusPill>
        <h2 className="mt-3 text-2xl font-semibold text-white">Authorized and watchlist vehicles</h2>
        <div className="mt-5 space-y-3">
          {currentCompanyVehicles.map((vehicle) => {
            const inside = activeEntries.some((entry) => entry.correctedPlateNumber === vehicle.vehicleNumber || entry.ocrPlateNumber === vehicle.vehicleNumber);
            return (
              <div key={vehicle.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{vehicle.vehicleNumber}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {vehicle.vehicleType} • {vehicle.ownerName} • {vehicle.driverName}
                    </div>
                  </div>
                  <StatusPill tone={vehicle.authorizationStatus === "watchlist" ? "danger" : vehicle.authorizationStatus === "expired" ? "warning" : "success"}>
                    {vehicle.authorizationStatus.toUpperCase()}
                  </StatusPill>
                </div>
                <div className="mt-3 text-xs text-slate-500">{inside ? "Currently inside" : "Not inside"}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(vehicle.id);
                      setForm({
                        vehicleNumber: vehicle.vehicleNumber,
                        vehicleType: vehicle.vehicleType,
                        ownerName: vehicle.ownerName,
                        driverName: vehicle.driverName,
                        authorizationStatus: vehicle.authorizationStatus,
                        notes: vehicle.notes ?? ""
                      });
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete vehicle ${vehicle.vehicleNumber}?`)) deleteVehicle(vehicle.id);
                    }}
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
