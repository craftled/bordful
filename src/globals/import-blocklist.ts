import type { GlobalAfterChangeHook, GlobalConfig } from "payload";

import { isAdmin } from "@/access/roles";
import { parseBlocklist } from "@/lib/bordfeed/blocklist";
import { unpublishBlockedJobs } from "@/lib/bordfeed/blocklist-store";

const unpublishMatches: GlobalAfterChangeHook = async ({ doc, req }) => {
  await unpublishBlockedJobs(req.payload, parseBlocklist(doc), req);
  return doc;
};

const ONE_PER_LINE = "One per line. Not case-sensitive.";

// Jobs from Bordfeed that match any entry are never imported, and saving
// unpublishes matching imported jobs already on the board.
export const ImportBlocklist: GlobalConfig = {
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    description:
      "Bordfeed jobs that match any entry are not imported. Saving also unpublishes matching imported jobs. Manual and paid jobs are never affected.",
  },
  authorship: false,
  fields: [
    {
      admin: {
        description: `Exact company names. ${ONE_PER_LINE}`,
      },
      name: "companies",
      type: "textarea",
    },
    {
      admin: {
        description: `Matched against the company domain and the apply and source links. A domain also covers its subdomains. ${ONE_PER_LINE}`,
      },
      name: "domains",
      type: "textarea",
    },
    {
      admin: {
        description: `Whole words or phrases, matched in the job title and summary. ${ONE_PER_LINE}`,
      },
      name: "keywords",
      type: "textarea",
    },
  ],
  hooks: { afterChange: [unpublishMatches] },
  label: "Import blocklist",
  slug: "import-blocklist",
  versions: false,
};
