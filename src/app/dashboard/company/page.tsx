"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";

export default function CompanyAdminPage() {
  const {
    currentCompany,
    currentCompanyGates,
    currentCompanyGuards,
    currentCompanyVehicles,
    activeEntries,
    currentCompanyAlerts,
    currentCompanyEntries,
    currentCompanyIncidents,
    missedVerifications,
    createGate,
    createGuard,
    createVehicle,
    updateCompanyStatus
  } = useLocalSystem();

  const [gateName, setGateName] = useState("");
  const [gateCode, setGateCode] = useState("");
  const [gateLocation, setGateLocation] = useState("");

  const [guardName, setGuardName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [guardGateId, setGuardGateId] = useState(currentCompanyGates[0]?.id ?? "");
  const [shiftLabel, setShiftLabel] = useState("08:00 - 20:00");

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [ownerName, setOwnerName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [authorizationStatus, setAuthorizationStatus] = useState<"authorized" | "expired" | "unknown" | "watchlist">("authorized");

  const stats = [
    { label: "Today's Entries", value: String(currentCompanyEntries.length), helper: "Saved locally" },
    { label: "Vehicles Inside", value: String(activeEntries.length), helper: "Derived from entries/exits" },
    { label: "Guards On Duty", value: String(currentCompanyGuards.length), helper: `${missedVerifications} missed verification` },
    { label: "Open Incidents", value: String(currentCompanyIncidents.filter((incident) => incident.status !== "closed").length), helper: `${currentCompanyAlerts.length} active alerts` }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <StatusPill tone="success">Company Admin</StatusPill>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{currentCompany?.name ?? "Company"}</h1>
          <p className="mt-2 text-sm text-slate-400">Manage gates, guards, and vehicles. Full security CRUD is under Guards.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/dashboard/company/guards" className="rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Security CRUD
          </a>
          <button
            type="button"
            onClick={() => currentCompany && updateCompanyStatus(currentCompany.id, currentCompany.status === "active" ? "suspended" : "active")}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white"
          >
            Toggle company status
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold text-white">Create gate</h2>
          <div className="mt-4 space-y-3">
            <input value={gateName} onChange={(e) => setGateName(e.target.value)} placeholder="Gate name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={gateCode} onChange={(e) => setGateCode(e.target.value)} placeholder="Gate code" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={gateLocation} onChange={(e) => setGateLocation(e.target.value)} placeholder="Location" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <button
              type="button"
              onClick={() => {
                if (!currentCompany || !gateName || !gateCode) return;
                createGate({ companyId: currentCompany.id, name: gateName, code: gateCode, location: gateLocation });
                setGateName("");
                setGateCode("");
                setGateLocation("");
              }}
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Save gate
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Create guard</h2>
          <div className="mt-4 space-y-3">
            <input value={guardName} onChange={(e) => setGuardName(e.target.value)} placeholder="Guard name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee ID" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="Mobile number" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <select value={guardGateId} onChange={(e) => setGuardGateId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              {currentCompanyGates.map((gate) => (
                <option key={gate.id} value={gate.id} className="bg-slate-950">
                  {gate.name}
                </option>
              ))}
            </select>
            <input value={shiftLabel} onChange={(e) => setShiftLabel(e.target.value)} placeholder="Shift label" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <button
              type="button"
              onClick={() => {
                if (!currentCompany || !guardName || !employeeId || !guardGateId) return;
                createGuard({ companyId: currentCompany.id, name: guardName, employeeId, mobileNumber, assignedGateId: guardGateId, shiftLabel });
                setGuardName("");
                setEmployeeId("");
                setMobileNumber("");
              }}
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Save guard
            </button>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Register vehicle</h2>
          <div className="mt-4 space-y-3">
            <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="Vehicle number" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} placeholder="Vehicle type" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            <select value={authorizationStatus} onChange={(e) => setAuthorizationStatus(e.target.value as typeof authorizationStatus)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
              <option value="authorized" className="bg-slate-950">Authorized</option>
              <option value="expired" className="bg-slate-950">Expired</option>
              <option value="unknown" className="bg-slate-950">Unknown</option>
              <option value="watchlist" className="bg-slate-950">Watchlist</option>
            </select>
            <button
              type="button"
              onClick={() => {
                if (!currentCompany || !vehicleNumber || !vehicleType) return;
                createVehicle({ companyId: currentCompany.id, vehicleNumber, vehicleType, ownerName, driverName, authorizationStatus });
                setVehicleNumber("");
                setOwnerName("");
                setDriverName("");
              }}
              className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Save vehicle
            </button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-lg font-semibold text-white">Gates and guards</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {currentCompanyGates.map((gate) => (
              <div key={gate.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">{gate.name}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {gate.code} • {gate.location}
                </div>
              </div>
            ))}
            {currentCompanyGuards.map((guard) => (
              <div key={guard.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">{guard.name}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {guard.employeeId} • {guard.shiftLabel}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-white">Vehicle and incident log</h2>
          <div className="mt-4 space-y-3">
            {currentCompanyVehicles.map((vehicle) => (
              <div key={vehicle.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">{vehicle.vehicleNumber}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {vehicle.vehicleType} • {vehicle.authorizationStatus}
                </div>
              </div>
            ))}
            {currentCompanyIncidents.slice(0, 3).map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="font-medium text-white">{incident.title}</div>
                <div className="mt-1 text-sm text-slate-400">{incident.description}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
