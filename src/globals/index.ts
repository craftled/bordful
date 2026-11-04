import { BordfeedConnection } from "./bordfeed-connection";
import { ImportBlocklist } from "./import-blocklist";
import { InstallState } from "./install-state";
import { SiteSettings } from "./site-settings";

export const globals = [
  SiteSettings,
  BordfeedConnection,
  ImportBlocklist,
  InstallState,
];
