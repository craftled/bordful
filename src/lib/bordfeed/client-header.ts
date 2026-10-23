import type { BordfulConfig } from "@/config";

import packageJson from "../../../package.json" with { type: "json" };

export const BORDFUL_VERSION = packageJson.version;
export const BORDFEED_CLIENT_HEADER = "X-Bordfeed-Client";

export function bordfeedClientHeaderValue(
  version: string = BORDFUL_VERSION
): string {
  return `bordful/${version}`;
}

export function bordfeedClientHeaders(
  config: BordfulConfig
): Record<string, string> {
  if (!config.telemetry.clientHeader) {
    return {};
  }

  return {
    [BORDFEED_CLIENT_HEADER]: bordfeedClientHeaderValue(),
  };
}
