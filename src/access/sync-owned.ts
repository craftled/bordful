import type { FieldAccess } from "payload";

import { SYNC_OWNED_ORIGINS } from "@/lib/domain/job-vocab";

import { isStaffField } from "./roles";

function originOf(doc: unknown): string | null {
  if (doc === null || typeof doc !== "object" || !("origin" in doc)) {
    return null;
  }

  return typeof doc.origin === "string" ? doc.origin : null;
}

export const syncOwnedFieldUpdate: FieldAccess = (args) => {
  const origin = originOf(args.doc);
  if (
    origin !== null &&
    (SYNC_OWNED_ORIGINS as readonly string[]).includes(origin)
  ) {
    return false;
  }

  return isStaffField(args);
};
