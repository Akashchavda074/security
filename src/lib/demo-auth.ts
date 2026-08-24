import type { Role } from "@/lib/roles";

export const DEMO_SESSION_KEY = "security-pwa-demo-session";
export const DEMO_LOGIN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true";

export type DemoAccount = {
  email: string;
  password: string;
  role: Role;
  label: string;
  companyName: string;
  companyId: string | null;
};

export const demoAccounts: DemoAccount[] = [
  {
    email: "superadmin@demo.local",
    password: "demo1234",
    role: "super_admin",
    label: "Super Admin",
    companyName: "System-wide",
    companyId: null
  },
  {
    email: "admin@apex.demo.local",
    password: "demo1234",
    role: "company_admin",
    label: "Company Admin",
    companyName: "Apex Logistics",
    companyId: "apex-logistics"
  },
  {
    email: "guard@apex.demo.local",
    password: "demo1234",
    role: "guard",
    label: "Guard",
    companyName: "Apex Logistics",
    companyId: "apex-logistics"
  }
];

export type DemoSession = {
  email: string;
  role: Role;
  companyId: string | null;
  companyName: string | null;
  loginMethod: "demo";
  signedInAt: string;
};

export function getDemoAccountByCredentials(email: string, password: string) {
  return demoAccounts.find((account) => account.email.toLowerCase() === email.toLowerCase().trim() && account.password === password);
}

export function createDemoSession(account: DemoAccount): DemoSession {
  return {
    email: account.email,
    role: account.role,
    companyId: account.companyId,
    companyName: account.companyName,
    loginMethod: "demo",
    signedInAt: new Date().toISOString()
  };
}
