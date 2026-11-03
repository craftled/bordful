import type { GlobalConfig } from "payload";

import { denyAll, isAdmin } from "@/access/roles";

export const InstallState: GlobalConfig = {
  access: {
    read: isAdmin,
    update: denyAll,
  },
  admin: { hidden: false },
  authorship: false,
  fields: [
    {
      admin: { readOnly: true },
      hidden: true,
      name: "installId",
      type: "text",
    },
    {
      admin: { readOnly: true },
      name: "latestVersion",
      type: "text",
    },
    {
      admin: { readOnly: true },
      name: "latestCheckedAt",
      type: "date",
    },
  ],
  slug: "install-state",
  versions: false,
};
