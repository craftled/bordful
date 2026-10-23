import type { Access, FieldAccess } from "payload";

import type { UserRole } from "@/lib/domain/job-vocab";

export function hasRole(user: unknown, role: UserRole): boolean {
  if (user === null || typeof user !== "object" || !("roles" in user)) {
    return false;
  }

  const { roles } = user;
  return Array.isArray(roles) && roles.includes(role);
}

export const isAdmin: Access = ({ req }) => hasRole(req.user, "admin");

export const isStaff: Access = ({ req }) =>
  hasRole(req.user, "admin") || hasRole(req.user, "editor");

export const isAdminField: FieldAccess = ({ req }) =>
  hasRole(req.user, "admin");

export const isStaffField: FieldAccess = ({ req }) =>
  hasRole(req.user, "admin") || hasRole(req.user, "editor");

export const denyAll = (): false => false;

export const anyone = (): true => true;
