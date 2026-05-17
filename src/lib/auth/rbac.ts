export type Role = "student" | "college_student" | "client_admin" | "super_admin";

const ROLE_RANK: Record<Role, number> = {
  student: 1,
  college_student: 1,
  client_admin: 5,
  super_admin: 10,
};

export function hasRole(role: Role | undefined | null, required: Role): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export function canAccess(role: Role | undefined | null, path: string): boolean {
  if (path.startsWith("/super")) return role === "super_admin";
  if (path.startsWith("/admin")) return role === "client_admin" || role === "super_admin";
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/assessment") ||
    path.startsWith("/report")
  ) {
    return !!role;
  }
  return true;
}
