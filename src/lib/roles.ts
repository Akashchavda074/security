export const ROLES = ["super_admin", "company_admin", "guard"] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && ROLES.includes(value as Role);
}

export function roleLabel(role: Role) {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "company_admin":
      return "Company Admin";
    case "guard":
      return "Guard";
  }
}
