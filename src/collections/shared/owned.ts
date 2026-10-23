import type { Field } from "payload";

import { syncOwnedFieldUpdate } from "@/access/sync-owned";

export function owned<T extends Field>(field: T): T {
  const current = field as T & {
    access?: { update?: typeof syncOwnedFieldUpdate };
  };

  return {
    ...current,
    access: {
      ...current.access,
      update: syncOwnedFieldUpdate,
    },
  } as T;
}
