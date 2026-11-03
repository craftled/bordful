import type { Access, Where } from "payload";

import { hasRole } from "./roles";

export function publishedAndUnexpiredWhere(now: Date): Where {
  return {
    and: [
      { _status: { equals: "published" } },
      {
        or: [
          { validThrough: { exists: false } },
          { validThrough: { greater_than: now.toISOString() } },
        ],
      },
    ],
  };
}

export const jobsRead: Access = ({ req }) => {
  if (hasRole(req.user, "admin") || hasRole(req.user, "editor")) {
    return true;
  }

  return publishedAndUnexpiredWhere(new Date());
};
