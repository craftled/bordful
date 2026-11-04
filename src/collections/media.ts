import path from "node:path";

import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from "payload";

import { anyone, isStaff } from "@/access/roles";
import { revalidateReadTags } from "@/lib/read/revalidate";
import { READ_TAGS } from "@/lib/read/tags";

// The cached site settings embed the logo upload. Replacing or deleting that
// file must not leave the header and footer on a dead image URL.
const revalidateSiteLogo: CollectionAfterChangeHook = ({ doc }) => {
  revalidateReadTags([READ_TAGS.siteSettings]);
  return doc;
};

const revalidateSiteLogoDelete: CollectionAfterDeleteHook = ({ doc }) => {
  revalidateReadTags([READ_TAGS.siteSettings]);
  return doc;
};

export const Media: CollectionConfig = {
  access: {
    create: isStaff,
    delete: isStaff,
    read: anyone,
    update: isStaff,
  },
  fields: [{ name: "alt", required: true, type: "text" }],
  hooks: {
    afterChange: [revalidateSiteLogo],
    afterDelete: [revalidateSiteLogoDelete],
  },
  slug: "media",
  upload: {
    mimeTypes: ["image/png", "image/jpeg", "image/webp", "image/avif"],
    staticDir: path.resolve(process.cwd(), "media"),
  },
  versions: false,
};
