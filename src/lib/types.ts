import type { Role } from "@/lib/roles";

export type CompanyStatus = "active" | "suspended";
export type VehicleStatus = "authorized" | "expired" | "unknown" | "watchlist";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type ShiftStatus = "active" | "late" | "offline" | "missed_verification" | "ended";
export type EntryDirection = "entry" | "exit";

export interface AuthSession {
  userId: string;
  email: string | null;
  role: Role;
  companyId: string | null;
  companyName: string | null;
}
