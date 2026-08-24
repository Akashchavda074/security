import type { Role } from "@/lib/roles";

export type ProfileRow = {
  id: string;
  company_id: string | null;
  role: Role;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
};

export type CompanyRow = {
  id: string;
  company_code: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  status: "active" | "suspended";
  created_at: string;
};

export type GateRow = {
  id: string;
  company_id: string;
  name: string;
  code: string;
  location: string | null;
  status: string;
};

export type GuardRow = {
  id: string;
  company_id: string;
  employee_id: string;
  mobile_number: string | null;
  email: string | null;
  assigned_gate_id: string | null;
  photo_url: string | null;
  status: string;
  joining_date: string | null;
  profile_id: string | null;
};

export type VehicleRow = {
  id: string;
  company_id: string;
  vehicle_number: string;
  vehicle_type: string;
  owner_name: string | null;
  driver_name: string | null;
  authorization_status: "authorized" | "expired" | "unknown" | "watchlist";
  notes: string | null;
};
