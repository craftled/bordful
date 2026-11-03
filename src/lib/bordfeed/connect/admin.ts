import { hasRole } from "@/access/roles";

import { ADMIN_ONLY_MESSAGE } from "./messages";

export function connectAdminDenial(user: unknown): string | null {
  return hasRole(user, "admin") ? null : ADMIN_ONLY_MESSAGE;
}
