// biome-ignore-all assist/source/useSortedKeys: spec block property order is the contract
import { defineBordfulConfig } from "./src/config/define-config";

export default defineBordfulConfig({
  // jobsPerSync: jobs per sync (20 to 100), also the size of the first sync.
  // jobsPerDay: daily cap. Bordfeed bills at most one credit per job fetched.
  bordfeed: {
    baseUrl: "https://bordfeed.com",
    syncCron: "0 6 * * *",
    sync: { jobsPerSync: 50, jobsPerDay: 200 },
  },
  telemetry: { clientHeader: true }, // false drops X-Bordfeed-Client and install_id
  board: { defaultTemplateId: "fully-remote" },
  alerts: { provider: "resend" },
  csp: { extraScriptOrigins: [], extraConnectOrigins: [] },
});
// src/custom/** is never touched upstream. Components there override
// named slots (header, footer, job-card-extra) through a typed registry.
