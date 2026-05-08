export const ADMIN_ROLES = ["super_admin", "admin_support"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin_support: "Admin Support",
};

export function isAdminRole(
  role: string | null | undefined,
): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export function canManageTenants(role: string | null): boolean {
  return role === "super_admin";
}

export function canImpersonate(role: string | null): boolean {
  return isAdminRole(role);
}

export function canManageAdmins(role: string | null): boolean {
  return role === "super_admin";
}

export function canViewAuditLog(role: string | null): boolean {
  return isAdminRole(role);
}
