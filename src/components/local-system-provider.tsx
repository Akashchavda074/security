"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  calculateTimeInside,
  createAuditLog,
  getInitialLocalSystemState,
  LOCAL_SYSTEM_STORAGE_KEY,
  type AlertRecord,
  type AuditLogRecord,
  type CompanyRecord,
  type GateRecord,
  type GuardRecord,
  type GuardVerificationRecord,
  type IncidentRecord,
  type SystemState,
  type VehicleEntryRecord,
  type VehicleExitRecord,
  type VehicleRecord
} from "@/lib/local-system";
import type { AlertSeverity, CompanyStatus, ShiftStatus, VehicleStatus } from "@/lib/types";

type LocalSystemContextValue = {
  state: SystemState;
  currentCompany?: CompanyRecord;
  currentCompanyGates: GateRecord[];
  currentCompanyGuards: GuardRecord[];
  currentCompanyVehicles: VehicleRecord[];
  currentCompanyEntries: VehicleEntryRecord[];
  currentCompanyExits: VehicleExitRecord[];
  currentCompanyVerifications: GuardVerificationRecord[];
  currentCompanyIncidents: IncidentRecord[];
  currentCompanyAlerts: AlertRecord[];
  auditLogs: AuditLogRecord[];
  activeEntries: Array<VehicleEntryRecord & { exitTime?: string; timeInside: string }>;
  missedVerifications: number;
  totalCompanies: number;
  totalGuards: number;
  totalTodayEntries: number;
  totalOpenIncidents: number;
  setCurrentCompanyId: (companyId: string) => void;
  setCurrentRole: (role: SystemState["currentRole"]) => void;
  createCompany: (input: { name: string; code: string; contactInfo: string; address: string; status?: CompanyStatus }) => void;
  updateCompany: (companyId: string, input: { name: string; code: string; contactInfo: string; address: string; status: CompanyStatus }) => void;
  updateCompanyStatus: (companyId: string, status: CompanyStatus) => void;
  deleteCompany: (companyId: string) => void;
  createGate: (input: { companyId: string; name: string; code: string; location: string }) => void;
  updateGate: (gateId: string, input: { name: string; code: string; location: string; status: "active" | "inactive" }) => void;
  deleteGate: (gateId: string) => void;
  createGuard: (input: { companyId: string; name: string; employeeId: string; mobileNumber: string; assignedGateId: string; shiftLabel: string }) => void;
  updateGuard: (guardId: string, input: { name: string; employeeId: string; mobileNumber: string; assignedGateId: string; shiftLabel: string; status: ShiftStatus }) => void;
  deleteGuard: (guardId: string) => void;
  createVehicle: (input: { companyId: string; vehicleNumber: string; vehicleType: string; ownerName: string; driverName: string; authorizationStatus: VehicleStatus; notes?: string }) => void;
  updateVehicle: (vehicleId: string, input: { vehicleNumber: string; vehicleType: string; ownerName: string; driverName: string; authorizationStatus: VehicleStatus; notes?: string }) => void;
  deleteVehicle: (vehicleId: string) => void;
  recordVehicleEntry: (input: {
    companyId: string;
    gateId: string;
    guardId: string;
    vehicleNumber: string;
    driverName: string;
    purpose: string;
    destination: string;
    ocrPlateNumber: string;
    ocrConfidence: number;
    correctedPlateNumber?: string;
    correctionReason?: string;
    vehicleImageName?: string;
    plateImageName?: string;
    remarks?: string;
  }) => void;
  recordVehicleExit: (input: { companyId: string; gateId: string; guardId: string; vehicleEntryId: string; exitImageName?: string }) => void;
  recordVerification: (input: { companyId: string; guardId: string; gateId: string; shiftId: string; imageName?: string }) => void;
  createIncident: (input: { companyId: string; gateId?: string; guardId?: string; severity: AlertSeverity; title: string; description: string }) => void;
  acknowledgeIncident: (incidentId: string) => void;
  closeIncident: (incidentId: string) => void;
};

const LocalSystemContext = createContext<LocalSystemContextValue | null>(null);

function saveState(state: SystemState) {
  window.localStorage.setItem(LOCAL_SYSTEM_STORAGE_KEY, JSON.stringify(state));
}

export function LocalSystemProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SystemState>(getInitialLocalSystemState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setCurrentCompanyId = useCallback((companyId: string) => {
    setState((current) => ({ ...current, currentCompanyId: companyId }));
  }, []);

  const setCurrentRole = useCallback((role: SystemState["currentRole"]) => {
    setState((current) => ({ ...current, currentRole: role }));
  }, []);

  const createCompany = useCallback(
    (input: { name: string; code: string; contactInfo: string; address: string; status?: CompanyStatus }) => {
      setState((current) => {
        const companyId = globalThis.crypto?.randomUUID?.() ?? `company-${Date.now()}`;
        const company: CompanyRecord = {
          id: companyId,
          name: input.name,
          code: input.code.toUpperCase(),
          status: input.status ?? "active",
          contactInfo: input.contactInfo,
          address: input.address,
          createdAt: new Date().toISOString()
        };
        return {
          ...current,
          companies: [company, ...current.companies],
          currentCompanyId: companyId,
          auditLogs: [createAuditLog("local-admin", "create_company", "companies", `Created company ${company.name}`, companyId, companyId), ...current.auditLogs]
        };
      });
    },
    []
  );

  const updateCompanyStatus = useCallback((companyId: string, status: CompanyStatus) => {
    setState((current) => ({
      ...current,
      companies: current.companies.map((company) => (company.id === companyId ? { ...company, status } : company)),
      auditLogs: [createAuditLog("local-admin", "update_company_status", "companies", `Changed company status to ${status}`, companyId, companyId), ...current.auditLogs]
    }));
  }, []);

  const updateCompany = useCallback((companyId: string, input: { name: string; code: string; contactInfo: string; address: string; status: CompanyStatus }) => {
    setState((current) => ({
      ...current,
      companies: current.companies.map((company) =>
        company.id === companyId
          ? {
              ...company,
              name: input.name,
              code: input.code.toUpperCase(),
              contactInfo: input.contactInfo,
              address: input.address,
              status: input.status
            }
          : company
      ),
      auditLogs: [createAuditLog("local-admin", "update_company", "companies", `Updated company ${input.name}`, companyId, companyId), ...current.auditLogs]
    }));
  }, []);

  const deleteCompany = useCallback((companyId: string) => {
    setState((current) => {
      const remainingCompanies = current.companies.filter((company) => company.id !== companyId);
      return {
        ...current,
        companies: remainingCompanies,
        gates: current.gates.filter((gate) => gate.companyId !== companyId),
        guards: current.guards.filter((guard) => guard.companyId !== companyId),
        vehicles: current.vehicles.filter((vehicle) => vehicle.companyId !== companyId),
        vehicleEntries: current.vehicleEntries.filter((entry) => entry.companyId !== companyId),
        vehicleExits: current.vehicleExits.filter((exit) => exit.companyId !== companyId),
        guardVerifications: current.guardVerifications.filter((item) => item.companyId !== companyId),
        incidents: current.incidents.filter((incident) => incident.companyId !== companyId),
        alerts: current.alerts.filter((alert) => alert.companyId !== companyId),
        currentCompanyId: current.currentCompanyId === companyId ? remainingCompanies[0]?.id ?? "" : current.currentCompanyId,
        auditLogs: [createAuditLog("local-admin", "delete_company", "companies", `Deleted company ${companyId}`, companyId, companyId), ...current.auditLogs]
      };
    });
  }, []);

  const createGate = useCallback((input: { companyId: string; name: string; code: string; location: string }) => {
    setState((current) => {
      const gateId = globalThis.crypto?.randomUUID?.() ?? `gate-${Date.now()}`;
      const gate: GateRecord = {
        id: gateId,
        companyId: input.companyId,
        name: input.name,
        code: input.code.toUpperCase(),
        location: input.location,
        status: "active"
      };
      return {
        ...current,
        gates: [gate, ...current.gates],
        auditLogs: [createAuditLog("local-admin", "create_gate", "gates", `Created gate ${gate.name}`, input.companyId, gateId), ...current.auditLogs]
      };
    });
  }, []);

  const updateGate = useCallback((gateId: string, input: { name: string; code: string; location: string; status: "active" | "inactive" }) => {
    setState((current) => {
      const existing = current.gates.find((gate) => gate.id === gateId);
      return {
        ...current,
        gates: current.gates.map((gate) =>
          gate.id === gateId
            ? {
                ...gate,
                name: input.name,
                code: input.code.toUpperCase(),
                location: input.location,
                status: input.status
              }
            : gate
        ),
        auditLogs: [createAuditLog("local-admin", "update_gate", "gates", `Updated gate ${input.name}`, existing?.companyId, gateId), ...current.auditLogs]
      };
    });
  }, []);

  const deleteGate = useCallback((gateId: string) => {
    setState((current) => {
      const existing = current.gates.find((gate) => gate.id === gateId);
      return {
        ...current,
        gates: current.gates.filter((gate) => gate.id !== gateId),
        guards: current.guards.map((guard) => (guard.assignedGateId === gateId ? { ...guard, assignedGateId: "" } : guard)),
        auditLogs: [createAuditLog("local-admin", "delete_gate", "gates", `Deleted gate ${gateId}`, existing?.companyId, gateId), ...current.auditLogs]
      };
    });
  }, []);

  const createGuard = useCallback((input: { companyId: string; name: string; employeeId: string; mobileNumber: string; assignedGateId: string; shiftLabel: string }) => {
    setState((current) => {
      const guardId = globalThis.crypto?.randomUUID?.() ?? `guard-${Date.now()}`;
      const guard: GuardRecord = {
        id: guardId,
        companyId: input.companyId,
        name: input.name,
        employeeId: input.employeeId.toUpperCase(),
        mobileNumber: input.mobileNumber,
        assignedGateId: input.assignedGateId,
        shiftLabel: input.shiftLabel,
        status: "active",
        joiningDate: new Date().toISOString().slice(0, 10)
      };
      return {
        ...current,
        guards: [guard, ...current.guards],
        auditLogs: [createAuditLog("local-admin", "create_guard", "guards", `Created guard ${guard.name}`, input.companyId, guardId), ...current.auditLogs]
      };
    });
  }, []);

  const updateGuard = useCallback(
    (guardId: string, input: { name: string; employeeId: string; mobileNumber: string; assignedGateId: string; shiftLabel: string; status: ShiftStatus }) => {
      setState((current) => {
        const existing = current.guards.find((guard) => guard.id === guardId);
        return {
          ...current,
          guards: current.guards.map((guard) =>
            guard.id === guardId
              ? {
                  ...guard,
                  name: input.name,
                  employeeId: input.employeeId.toUpperCase(),
                  mobileNumber: input.mobileNumber,
                  assignedGateId: input.assignedGateId,
                  shiftLabel: input.shiftLabel,
                  status: input.status
                }
              : guard
          ),
          auditLogs: [createAuditLog("local-admin", "update_guard", "guards", `Updated guard ${input.name}`, existing?.companyId, guardId), ...current.auditLogs]
        };
      });
    },
    []
  );

  const deleteGuard = useCallback((guardId: string) => {
    setState((current) => {
      const existing = current.guards.find((guard) => guard.id === guardId);
      return {
        ...current,
        guards: current.guards.filter((guard) => guard.id !== guardId),
        auditLogs: [createAuditLog("local-admin", "delete_guard", "guards", `Deleted guard ${guardId}`, existing?.companyId, guardId), ...current.auditLogs]
      };
    });
  }, []);

  const createVehicle = useCallback((input: { companyId: string; vehicleNumber: string; vehicleType: string; ownerName: string; driverName: string; authorizationStatus: VehicleStatus; notes?: string }) => {
    setState((current) => {
      const vehicleId = globalThis.crypto?.randomUUID?.() ?? `vehicle-${Date.now()}`;
      const vehicle: VehicleRecord = {
        id: vehicleId,
        companyId: input.companyId,
        vehicleNumber: input.vehicleNumber.toUpperCase(),
        vehicleType: input.vehicleType,
        ownerName: input.ownerName,
        driverName: input.driverName,
        authorizationStatus: input.authorizationStatus,
        notes: input.notes
      };
      return {
        ...current,
        vehicles: [vehicle, ...current.vehicles],
        auditLogs: [createAuditLog("local-admin", "create_vehicle", "vehicles", `Registered vehicle ${vehicle.vehicleNumber}`, input.companyId, vehicleId), ...current.auditLogs]
      };
    });
  }, []);

  const updateVehicle = useCallback(
    (vehicleId: string, input: { vehicleNumber: string; vehicleType: string; ownerName: string; driverName: string; authorizationStatus: VehicleStatus; notes?: string }) => {
      setState((current) => {
        const existing = current.vehicles.find((vehicle) => vehicle.id === vehicleId);
        return {
          ...current,
          vehicles: current.vehicles.map((vehicle) =>
            vehicle.id === vehicleId
              ? {
                  ...vehicle,
                  vehicleNumber: input.vehicleNumber.toUpperCase(),
                  vehicleType: input.vehicleType,
                  ownerName: input.ownerName,
                  driverName: input.driverName,
                  authorizationStatus: input.authorizationStatus,
                  notes: input.notes,
                  watchlisted: input.authorizationStatus === "watchlist"
                }
              : vehicle
          ),
          auditLogs: [createAuditLog("local-admin", "update_vehicle", "vehicles", `Updated vehicle ${input.vehicleNumber}`, existing?.companyId, vehicleId), ...current.auditLogs]
        };
      });
    },
    []
  );

  const deleteVehicle = useCallback((vehicleId: string) => {
    setState((current) => {
      const existing = current.vehicles.find((vehicle) => vehicle.id === vehicleId);
      return {
        ...current,
        vehicles: current.vehicles.filter((vehicle) => vehicle.id !== vehicleId),
        auditLogs: [createAuditLog("local-admin", "delete_vehicle", "vehicles", `Deleted vehicle ${vehicleId}`, existing?.companyId, vehicleId), ...current.auditLogs]
      };
    });
  }, []);

  const recordVehicleEntry = useCallback(
    (input: {
      companyId: string;
      gateId: string;
      guardId: string;
      vehicleNumber: string;
      driverName: string;
      purpose: string;
      destination: string;
      ocrPlateNumber: string;
      ocrConfidence: number;
      correctedPlateNumber?: string;
      correctionReason?: string;
      vehicleImageName?: string;
      plateImageName?: string;
      remarks?: string;
    }) => {
      setState((current) => {
        const vehicle = current.vehicles.find((item) => item.companyId === input.companyId && item.vehicleNumber.toUpperCase() === input.vehicleNumber.toUpperCase());
        const entryId = globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now()}`;
        const normalizedPlate = (input.correctedPlateNumber ?? input.ocrPlateNumber).toUpperCase();
        const entry: VehicleEntryRecord = {
          id: entryId,
          clientEventId: globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}`,
          companyId: input.companyId,
          gateId: input.gateId,
          guardId: input.guardId,
          vehicleId: vehicle?.id,
          vehicleNumber: input.vehicleNumber.toUpperCase(),
          ocrPlateNumber: input.ocrPlateNumber.toUpperCase(),
          correctedPlateNumber: input.correctedPlateNumber?.toUpperCase(),
          ocrConfidence: input.ocrConfidence,
          correctionReason: input.correctionReason,
          vehicleImageName: input.vehicleImageName,
          plateImageName: input.plateImageName,
          driverName: input.driverName,
          purpose: input.purpose,
          destination: input.destination,
          remarks: input.remarks,
          entryTime: new Date().toISOString()
        };

        const alert: AlertRecord[] = [];
        if (!vehicle || vehicle.authorizationStatus === "unknown" || vehicle.authorizationStatus === "watchlist") {
          alert.push({
            id: globalThis.crypto?.randomUUID?.() ?? `alert-${Date.now()}`,
            companyId: input.companyId,
            severity: vehicle?.authorizationStatus === "watchlist" ? "critical" : "medium",
            title: vehicle?.authorizationStatus === "watchlist" ? "Watchlist vehicle detected" : "Unknown vehicle",
            detail: `${normalizedPlate} recorded at gate ${input.gateId}`,
            createdAt: new Date().toISOString()
          });
        }

        return {
          ...current,
          vehicleEntries: [entry, ...current.vehicleEntries],
          alerts: [...alert, ...current.alerts],
          auditLogs: [
            createAuditLog(
              "local-guard",
              "create_vehicle_entry",
              "vehicle_entries",
              `Vehicle ${normalizedPlate} entered through gate ${input.gateId}`,
              input.companyId,
              entryId
            ),
            ...current.auditLogs
          ]
        };
      });
    },
    []
  );

  const recordVehicleExit = useCallback((input: { companyId: string; gateId: string; guardId: string; vehicleEntryId: string; exitImageName?: string }) => {
    setState((current) => {
      const exitId = globalThis.crypto?.randomUUID?.() ?? `exit-${Date.now()}`;
      const exit: VehicleExitRecord = {
        id: exitId,
        clientEventId: globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}`,
        companyId: input.companyId,
        gateId: input.gateId,
        guardId: input.guardId,
        vehicleEntryId: input.vehicleEntryId,
        exitTime: new Date().toISOString(),
        exitImageName: input.exitImageName
      };
      return {
        ...current,
        vehicleExits: [exit, ...current.vehicleExits],
        auditLogs: [createAuditLog("local-guard", "create_vehicle_exit", "vehicle_exits", `Vehicle exit saved for entry ${input.vehicleEntryId}`, input.companyId, exitId), ...current.auditLogs]
      };
    });
  }, []);

  const recordVerification = useCallback((input: { companyId: string; guardId: string; gateId: string; shiftId: string; imageName?: string }) => {
    setState((current) => {
      const verificationId = globalThis.crypto?.randomUUID?.() ?? `verification-${Date.now()}`;
      const verification: GuardVerificationRecord = {
        id: verificationId,
        clientEventId: globalThis.crypto?.randomUUID?.() ?? `event-${Date.now()}`,
        companyId: input.companyId,
        guardId: input.guardId,
        gateId: input.gateId,
        shiftId: input.shiftId,
        verificationTime: new Date().toISOString(),
        imageName: input.imageName
      };
      return {
        ...current,
        guardVerifications: [verification, ...current.guardVerifications],
        guards: current.guards.map((guard) =>
          guard.id === input.guardId ? { ...guard, lastVerificationAt: verification.verificationTime, status: "active" } : guard
        ),
        auditLogs: [createAuditLog("local-guard", "create_verification", "guard_verifications", `Guard verification recorded for ${input.guardId}`, input.companyId, verificationId), ...current.auditLogs]
      };
    });
  }, []);

  const createIncident = useCallback((input: { companyId: string; gateId?: string; guardId?: string; severity: AlertSeverity; title: string; description: string }) => {
    setState((current) => {
      const incidentId = globalThis.crypto?.randomUUID?.() ?? `incident-${Date.now()}`;
      const incident: IncidentRecord = {
        id: incidentId,
        companyId: input.companyId,
        gateId: input.gateId,
        guardId: input.guardId,
        severity: input.severity,
        title: input.title,
        description: input.description,
        status: "open",
        createdAt: new Date().toISOString()
      };
      return {
        ...current,
        incidents: [incident, ...current.incidents],
        alerts: [
          {
            id: globalThis.crypto?.randomUUID?.() ?? `alert-${Date.now()}`,
            companyId: input.companyId,
            severity: input.severity,
            title: input.title,
            detail: input.description,
            createdAt: new Date().toISOString()
          },
          ...current.alerts
        ],
        auditLogs: [createAuditLog("local-guard", "create_incident", "incidents", input.title, input.companyId, incidentId), ...current.auditLogs]
      };
    });
  }, []);

  const acknowledgeIncident = useCallback((incidentId: string) => {
    setState((current) => ({
      ...current,
      incidents: current.incidents.map((incident) => (incident.id === incidentId ? { ...incident, status: "acknowledged" } : incident)),
      auditLogs: [createAuditLog("local-admin", "acknowledge_incident", "incidents", `Acknowledged incident ${incidentId}`, undefined, incidentId), ...current.auditLogs]
    }));
  }, []);

  const closeIncident = useCallback((incidentId: string) => {
    setState((current) => ({
      ...current,
      incidents: current.incidents.map((incident) => (incident.id === incidentId ? { ...incident, status: "closed" } : incident)),
      auditLogs: [createAuditLog("local-admin", "close_incident", "incidents", `Closed incident ${incidentId}`, undefined, incidentId), ...current.auditLogs]
    }));
  }, []);

  const currentCompany = state.companies.find((company) => company.id === state.currentCompanyId) ?? state.companies[0];
  const currentCompanyGates = useMemo(() => state.gates.filter((gate) => gate.companyId === currentCompany?.id), [currentCompany?.id, state.gates]);
  const currentCompanyGuards = useMemo(() => state.guards.filter((guard) => guard.companyId === currentCompany?.id), [currentCompany?.id, state.guards]);
  const currentCompanyVehicles = useMemo(() => state.vehicles.filter((vehicle) => vehicle.companyId === currentCompany?.id), [currentCompany?.id, state.vehicles]);
  const currentCompanyEntries = useMemo(() => state.vehicleEntries.filter((entry) => entry.companyId === currentCompany?.id), [currentCompany?.id, state.vehicleEntries]);
  const currentCompanyExits = useMemo(() => state.vehicleExits.filter((exit) => exit.companyId === currentCompany?.id), [currentCompany?.id, state.vehicleExits]);
  const currentCompanyVerifications = useMemo(() => state.guardVerifications.filter((verification) => verification.companyId === currentCompany?.id), [currentCompany?.id, state.guardVerifications]);
  const currentCompanyIncidents = useMemo(() => state.incidents.filter((incident) => incident.companyId === currentCompany?.id), [currentCompany?.id, state.incidents]);
  const currentCompanyAlerts = useMemo(() => state.alerts.filter((alert) => alert.companyId === currentCompany?.id), [currentCompany?.id, state.alerts]);
  const activeEntries = useMemo(() => {
    return currentCompanyEntries
      .map((entry) => {
        const exit = currentCompanyExits.find((item) => item.vehicleEntryId === entry.id);
        return {
          ...entry,
          exitTime: exit?.exitTime,
          timeInside: calculateTimeInside(entry.entryTime, exit?.exitTime)
        };
      })
      .filter((entry) => !entry.exitTime);
  }, [currentCompanyEntries, currentCompanyExits]);

  const missedVerifications = useMemo(() => {
    const latestByGuard = new Map<string, string>();
    currentCompanyVerifications.forEach((verification) => {
      const current = latestByGuard.get(verification.guardId);
      if (!current || new Date(verification.verificationTime).getTime() > new Date(current).getTime()) {
        latestByGuard.set(verification.guardId, verification.verificationTime);
      }
    });

    const intervalMs = 60 * 60 * 1000;
    return currentCompanyGuards.filter((guard) => {
      const latest = latestByGuard.get(guard.id);
      if (!latest) {
        return true;
      }
      return Date.now() - new Date(latest).getTime() > intervalMs;
    }).length;
  }, [currentCompanyGuards, currentCompanyVerifications]);

  const totalCompanies = state.companies.length;
  const totalGuards = state.guards.length;
  const totalTodayEntries = state.vehicleEntries.length;
  const totalOpenIncidents = state.incidents.filter((incident) => incident.status !== "closed").length;

  const value = useMemo<LocalSystemContextValue>(
    () => ({
      state,
      currentCompany,
      currentCompanyGates,
      currentCompanyGuards,
      currentCompanyVehicles,
      currentCompanyEntries,
      currentCompanyExits,
      currentCompanyVerifications,
      currentCompanyIncidents,
      currentCompanyAlerts,
      auditLogs: state.auditLogs,
      activeEntries,
      missedVerifications,
      totalCompanies,
      totalGuards,
      totalTodayEntries,
      totalOpenIncidents,
      setCurrentCompanyId,
      setCurrentRole,
      createCompany,
      updateCompany,
      updateCompanyStatus,
      deleteCompany,
      createGate,
      updateGate,
      deleteGate,
      createGuard,
      updateGuard,
      deleteGuard,
      createVehicle,
      updateVehicle,
      deleteVehicle,
      recordVehicleEntry,
      recordVehicleExit,
      recordVerification,
      createIncident,
      acknowledgeIncident,
      closeIncident
    }),
    [
      activeEntries,
      acknowledgeIncident,
      closeIncident,
      createCompany,
      createGate,
      createGuard,
      createIncident,
      createVehicle,
      currentCompany,
      currentCompanyAlerts,
      currentCompanyEntries,
      currentCompanyExits,
      currentCompanyGates,
      currentCompanyGuards,
      currentCompanyIncidents,
      currentCompanyVehicles,
      currentCompanyVerifications,
      deleteCompany,
      deleteGate,
      deleteGuard,
      deleteVehicle,
      missedVerifications,
      recordVerification,
      recordVehicleEntry,
      recordVehicleExit,
      setCurrentCompanyId,
      setCurrentRole,
      state,
      totalCompanies,
      totalGuards,
      totalOpenIncidents,
      totalTodayEntries,
      updateCompany,
      updateCompanyStatus,
      updateGate,
      updateGuard,
      updateVehicle
    ]
  );

  return <LocalSystemContext.Provider value={value}>{children}</LocalSystemContext.Provider>;
}

export function useLocalSystem() {
  const context = useContext(LocalSystemContext);
  if (!context) {
    throw new Error("useLocalSystem must be used within LocalSystemProvider");
  }
  return context;
}
