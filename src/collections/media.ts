import path from "node:path";

import type { CollectionConfig } from "payload";

import { anyone, isStaff } from "@/access/roles";

export const Media: CollectionConfig = {
  access: {
    create: isStaff,
    delete: isStaff,
    read: anyone,
    update: isStaff,
  },
  fields: [{ name: "alt", required: true, type: "text" }],
  slug: "media",
  upload: {
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/avif"],
    staticDir: path.resolve(process.cwd(), "media"),
  },
  versions: false,
};
