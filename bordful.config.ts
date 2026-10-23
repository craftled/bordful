// biome-ignore-all assist/source/useSortedKeys: spec block property order is the contract
import { defineBordfulConfig } from "./src/config/define-config";

export default defineBordfulConfig({
  bordfeed: { baseUrl: "https://bordfeed.com", syncCron: "0 6 * * *" },
  telemetry: { clientHeader: true }, // false drops X-Bordfeed-Client and install_id
  board: { defaultTemplateId: "remote-engineering" },
  alerts: { provider: "resend" },
  csp: { extraScriptOrigins: [], extraConnectOrigins: [] },
});
// src/custom/** is never touched upstream. Components there override
// named slots (header, footer, job-card-extra) through a typed registry.
