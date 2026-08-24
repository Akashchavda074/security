import type { AlertSeverity, CompanyStatus, ShiftStatus, VehicleStatus } from "@/lib/types";

export type CompanyRecord = {
  id: string;
  name: string;
  code: string;
  status: CompanyStatus;
  contactInfo: string;
  address: string;
  createdAt: string;
};

export type GateRecord = {
  id: string;
  companyId: string;
  name: string;
  code: string;
  location: string;
  status: "active" | "inactive";
};

export type GuardRecord = {
  id: string;
  companyId: string;
  name: string;
  employeeId: string;
  mobileNumber: string;
  email?: string;
  photoUrl?: string;
  assignedGateId: string;
  shiftLabel: string;
  status: ShiftStatus;
  joiningDate: string;
  lastVerificationAt?: string;
};

export type VehicleRecord = {
  id: string;
  companyId: string;
  vehicleNumber: string;
  vehicleType: string;
  ownerName: string;
  driverName: string;
  authorizationStatus: VehicleStatus;
  validFrom?: string;
  validUntil?: string;
  notes?: string;
  watchlisted?: boolean;
};

export type VehicleEntryRecord = {
  id: string;
  clientEventId: string;
  companyId: string;
  gateId: string;
  guardId: string;
  vehicleId?: string;
  vehicleNumber: string;
  ocrPlateNumber: string;
  correctedPlateNumber?: string;
  ocrConfidence: number;
  correctionReason?: string;
  vehicleImageName?: string;
  plateImageName?: string;
  driverName: string;
  purpose: string;
  destination: string;
  remarks?: string;
  entryTime: string;
};

export type VehicleExitRecord = {
  id: string;
  clientEventId: string;
  companyId: string;
  gateId: string;
  guardId: string;
  vehicleEntryId: string;
  exitTime: string;
  exitImageName?: string;
};

export type GuardVerificationRecord = {
  id: string;
  clientEventId: string;
  companyId: string;
  guardId: string;
  gateId: string;
  shiftId: string;
  verificationTime: string;
  imageName?: string;
};

export type IncidentRecord = {
  id: string;
  companyId: string;
  gateId?: string;
  guardId?: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: "open" | "acknowledged" | "closed";
  createdAt: string;
};

export type AuditLogRecord = {
  id: string;
  companyId?: string;
  actor: string;
  action: string;
  entity: string;
  entityId?: string;
  detail: string;
  createdAt: string;
};

export type AlertRecord = {
  id: string;
  companyId: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  createdAt: string;
};

export type SystemState = {
  companies: CompanyRecord[];
  gates: GateRecord[];
  guards: GuardRecord[];
  vehicles: VehicleRecord[];
  vehicleEntries: VehicleEntryRecord[];
  vehicleExits: VehicleExitRecord[];
  guardVerifications: GuardVerificationRecord[];
  incidents: IncidentRecord[];
  alerts: AlertRecord[];
  auditLogs: AuditLogRecord[];
  currentCompanyId: string;
  currentRole: "super_admin" | "company_admin" | "guard";
};

export const LOCAL_SYSTEM_STORAGE_KEY = "security-pwa-local-system-v2";
export const LOCAL_ROLE_STORAGE_KEY = "security-pwa-local-role";

function id() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

function seedState(): SystemState {
  const apex = id();
  const bharat = id();
  const apexGate1 = id();
  const apexGate2 = id();
  const bharatGate = id();
  const apexGuard1 = id();
  const apexGuard2 = id();
  const bharatGuard = id();
  const apexVehicle1 = id();
  const apexVehicle2 = id();
  const bharatVehicle = id();
  const entry1 = id();
  const entry2 = id();
  const verification1 = id();
  const incident1 = id();

  return {
    companies: [
      {
        id: apex,
        name: "Apex Logistics",
        code: "APLX",
        status: "active",
        contactInfo: "ops@apex.demo",
        address: "Mumbai, Maharashtra",
        createdAt: now()
      },
      {
        id: bharat,
        name: "Bharat Metals",
        code: "BHMT",
        status: "active",
        contactInfo: "security@bharat.demo",
        address: "Ahmedabad, Gujarat",
        createdAt: now()
      }
    ],
    gates: [
      { id: apexGate1, companyId: apex, name: "Gate 1", code: "APLX-G1", location: "North entrance", status: "active" },
      { id: apexGate2, companyId: apex, name: "Main Gate", code: "APLX-MAIN", location: "Main road", status: "active" },
      { id: bharatGate, companyId: bharat, name: "Warehouse Gate", code: "BHMT-WH", location: "Warehouse block", status: "active" }
    ],
    guards: [
      {
        id: apexGuard1,
        companyId: apex,
        name: "Rahul Sharma",
        employeeId: "GUARD-001",
        mobileNumber: "9000000001",
        email: "rahul@apex.demo",
        assignedGateId: apexGate2,
        shiftLabel: "08:00 - 20:00",
        status: "active",
        joiningDate: "2026-01-12",
        // Seed as overdue so hourly reminder can be tested immediately.
        lastVerificationAt: new Date(Date.now() - 70 * 60 * 1000).toISOString()
      },
      {
        id: apexGuard2,
        companyId: apex,
        name: "Asha Devi",
        employeeId: "GUARD-017",
        mobileNumber: "9000000002",
        assignedGateId: apexGate1,
        shiftLabel: "20:00 - 08:00",
        status: "late",
        joiningDate: "2026-03-02",
        lastVerificationAt: new Date(Date.now() - 90 * 60 * 1000).toISOString()
      },
      {
        id: bharatGuard,
        companyId: bharat,
        name: "Imran Khan",
        employeeId: "GUARD-024",
        mobileNumber: "9000000003",
        assignedGateId: bharatGate,
        shiftLabel: "08:00 - 20:00",
        status: "missed_verification",
        joiningDate: "2026-04-20"
      }
    ],
    vehicles: [
      {
        id: apexVehicle1,
        companyId: apex,
        vehicleNumber: "GJ39CA2073",
        vehicleType: "Truck",
        ownerName: "Apex Freight",
        driverName: "Karan Patel",
        authorizationStatus: "authorized",
        validFrom: "2026-01-01",
        validUntil: "2026-12-31"
      },
      {
        id: apexVehicle2,
        companyId: apex,
        vehicleNumber: "MH12AB4488",
        vehicleType: "Car",
        ownerName: "Unknown",
        driverName: "Unknown",
        authorizationStatus: "watchlist",
        notes: "Repeated suspicious entry attempts",
        watchlisted: true
      },
      {
        id: bharatVehicle,
        companyId: bharat,
        vehicleNumber: "TN09CD1234",
        vehicleType: "Bus",
        ownerName: "Bharat Transport",
        driverName: "Naveen Rao",
        authorizationStatus: "expired",
        validFrom: "2025-01-01",
        validUntil: "2026-01-31"
      }
    ],
    vehicleEntries: [
      {
        id: entry1,
        clientEventId: id(),
        companyId: apex,
        gateId: apexGate2,
        guardId: apexGuard1,
        vehicleId: apexVehicle1,
        vehicleNumber: "GJ39CA2073",
        ocrPlateNumber: "GJ39CA2073",
        correctedPlateNumber: "GJ39CA2073",
        ocrConfidence: 0.94,
        driverName: "Karan Patel",
        purpose: "Material delivery",
        destination: "Warehouse A",
        entryTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: entry2,
        clientEventId: id(),
        companyId: apex,
        gateId: apexGate1,
        guardId: apexGuard2,
        vehicleId: apexVehicle2,
        vehicleNumber: "MH12AB4488",
        ocrPlateNumber: "MH12AB4488",
        ocrConfidence: 0.71,
        driverName: "Unknown",
        purpose: "Inspection",
        destination: "Loading bay",
        entryTime: new Date(Date.now() - 35 * 60 * 1000).toISOString()
      }
    ],
    vehicleExits: [],
    guardVerifications: [
      {
        id: verification1,
        clientEventId: id(),
        companyId: apex,
        guardId: apexGuard1,
        gateId: apexGate2,
        shiftId: "shift-1",
        verificationTime: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
        imageName: "verification-apex.jpg"
      }
    ],
    incidents: [
      {
        id: incident1,
        companyId: apex,
        gateId: apexGate1,
        guardId: apexGuard2,
        severity: "high",
        title: "Watchlist vehicle detected",
        description: "MH12AB4488 entered Main Gate and needs review.",
        status: "open",
        createdAt: now()
      }
    ],
    alerts: [
      {
        id: id(),
        companyId: apex,
        severity: "critical",
        title: "Watchlist vehicle detected",
        detail: "MH12AB4488 entered Main Gate at Apex Logistics.",
        createdAt: now()
      },
      {
        id: id(),
        companyId: bharat,
        severity: "high",
        title: "Guard missed verification",
        detail: "GUARD-024 missed the 11:00 verification window.",
        createdAt: now()
      }
    ],
    auditLogs: [
      {
        id: id(),
        companyId: apex,
        actor: "system",
        action: "seeded",
        entity: "companies",
        entityId: apex,
        detail: "Seed data created for Apex Logistics",
        createdAt: now()
      }
    ],
    currentCompanyId: apex,
    currentRole: "guard"
  };
}

export function getInitialLocalSystemState(): SystemState {
  if (typeof window === "undefined") {
    return seedState();
  }

  const raw = window.localStorage.getItem(LOCAL_SYSTEM_STORAGE_KEY);
  if (!raw) {
    return seedState();
  }

  try {
    return JSON.parse(raw) as SystemState;
  } catch {
    return seedState();
  }
}

export function createAuditLog(
  actor: string,
  action: string,
  entity: string,
  detail: string,
  companyId?: string,
  entityId?: string
): AuditLogRecord {
  return {
    id: id(),
    actor,
    action,
    entity,
    detail,
    companyId,
    entityId,
    createdAt: now()
  };
}

export function calculateTimeInside(entryTime: string, exitTime?: string) {
  const start = new Date(entryTime).getTime();
  const end = exitTime ? new Date(exitTime).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

