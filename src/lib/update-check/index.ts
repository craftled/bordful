// biome-ignore-all lint/performance/noBarrelFile: update-check entry re-exports the public API

export type { UpdateCheckDeps, UpdateCheckResult } from "./check";
export { checkForUpdate } from "./check";
export { compareVersions, pickLatestRelease } from "./version";
