import type { AlertSeverity, CompanyStatus, EntryDirection, ShiftStatus, VehicleStatus } from "@/lib/types";

export interface DashboardStat {
  label: string;
  value: string;
  helper: string;
}

export interface ActivityItem {
  title: string;
  detail: string;
  time: string;
}

export interface VehicleTimelineItem {
  time: string;
  note: string;
}

export interface VehicleRecord {
  plate: string;
  status: VehicleStatus;
  gate: string;
  driver: string;
  direction: EntryDirection;
  time: string;
  duration?: string;
}

export interface AlertItem {
  title: string;
  severity: AlertSeverity;
  detail: string;
}

export interface CompanyRecord {
  name: string;
  code: string;
  status: CompanyStatus;
  guards: number;
  gates: number;
  vehicles: number;
  entriesToday: number;
}

export interface GuardRecord {
  name: string;
  employeeId: string;
  gate: string;
  shift: string;
  status: ShiftStatus;
}

export const companyStats: DashboardStat[] = [
  { label: "Today's Vehicle Entries", value: "128", helper: "+14% from yesterday" },
  { label: "Today's Vehicle Exits", value: "119", helper: "9 vehicles still inside" },
  { label: "Guards On Duty", value: "32", helper: "4 pending verification" },
  { label: "Open Incidents", value: "3", helper: "1 critical alert" }
];

export const guardStats: DashboardStat[] = [
  { label: "Shift Status", value: "ACTIVE", helper: "Gate 2" },
  { label: "Last Verification", value: "09:00", helper: "Within policy window" },
  { label: "Offline Queue", value: "2", helper: "Records waiting to sync" },
  { label: "Gate Alerts", value: "1", helper: "Watchlist vehicle detected" }
];

export const superAdminStats: DashboardStat[] = [
  { label: "Total Companies", value: "24", helper: "22 active, 2 suspended" },
  { label: "Total Guards", value: "1,248", helper: "1,103 active" },
  { label: "Today's Entries", value: "4,803", helper: "System-wide" },
  { label: "Storage Usage", value: "1.7 TB", helper: "Private object storage" }
];

export const companies: CompanyRecord[] = [
  { name: "Apex Logistics", code: "APLX", status: "active", guards: 18, gates: 4, vehicles: 112, entriesToday: 68 },
  { name: "Bharat Metals", code: "BHMT", status: "active", guards: 11, gates: 3, vehicles: 78, entriesToday: 41 },
  { name: "Nova Pharma", code: "NVPH", status: "suspended", guards: 7, gates: 2, vehicles: 43, entriesToday: 0 }
];

export const guards: GuardRecord[] = [
  { name: "Rahul Sharma", employeeId: "GUARD-001", gate: "Gate 2", shift: "08:00 - 20:00", status: "active" },
  { name: "Asha Devi", employeeId: "GUARD-017", gate: "Main Gate", shift: "20:00 - 08:00", status: "late" },
  { name: "Imran Khan", employeeId: "GUARD-024", gate: "Warehouse Gate", shift: "08:00 - 20:00", status: "missed_verification" }
];

export const vehicleActivity: VehicleRecord[] = [
  { plate: "GJ39CA2073", status: "authorized", gate: "Gate 2", driver: "Karan Patel", direction: "entry", time: "20:14", duration: "02h 17m" },
  { plate: "MH12AB4488", status: "watchlist", gate: "Main Gate", driver: "Unknown", direction: "entry", time: "20:32", duration: "00h 44m" },
  { plate: "TN09CD1234", status: "expired", gate: "Warehouse Gate", driver: "Naveen Rao", direction: "exit", time: "21:11", duration: "05h 02m" }
];

export const alerts: AlertItem[] = [
  { title: "Watchlist vehicle detected", severity: "critical", detail: "MH12AB4488 entered Main Gate at 20:32." },
  { title: "Guard missed verification", severity: "high", detail: "GUARD-024 missed the 11:00 verification window." },
  { title: "Vehicle still inside unusually long", severity: "medium", detail: "GJ39CA2073 has been inside for 02h 17m." }
];

export const recentActivity: ActivityItem[] = [
  { title: "Vehicle entry saved", detail: "GJ39CA2073 recorded at Gate 2", time: "2 min ago" },
  { title: "Plate corrected", detail: "OCR corrected by Rahul Sharma", time: "8 min ago" },
  { title: "Verification synced", detail: "Guard verification uploaded after reconnect", time: "14 min ago" }
];

export const vehicleTimeline: VehicleTimelineItem[] = [
  { time: "20:14:03", note: "Vehicle entered Gate 2" },
  { time: "20:14:04", note: "OCR detected GJ39CA2073" },
  { time: "20:14:10", note: "Guard confirmed plate" },
  { time: "22:31:15", note: "Vehicle still inside" },
  { time: "23:42:02", note: "Vehicle exited Gate 2" }
];
