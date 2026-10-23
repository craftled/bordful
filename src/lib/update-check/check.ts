import type { Payload } from "payload";

import { BORDFUL_VERSION } from "@/lib/bordfeed/client-header";

import { compareVersions, pickLatestRelease } from "./version";

const DEFAULT_RELEASES_URL =
  "https://api.github.com/repos/craftled/bordful/releases?per_page=20";
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export interface UpdateCheckDeps {
  fetch?: typeof fetch;
  now?: Date;
  url?: string;
}

export interface UpdateCheckResult {
  current: string;
  isNewer: boolean;
  latest: string | null;
}

function toResult(latest: string | null): UpdateCheckResult {
  return {
    current: BORDFUL_VERSION,
    isNewer: latest !== null && compareVersions(latest, BORDFUL_VERSION) === 1,
    latest,
  };
}

function checkedAtMs(value: unknown): number | null {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return null;
  }

  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

function isFresh(checkedAt: unknown, now: Date): boolean {
  const ms = checkedAtMs(checkedAt);
  if (ms === null) {
    return false;
  }

  return now.getTime() - ms < CHECK_INTERVAL_MS;
}

function storedVersion(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function readInstallState(payload: Payload): Promise<{
  checkedAt: unknown;
  latest: string | null;
}> {
  const state = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    slug: "install-state",
  });

  return {
    checkedAt: state.latestCheckedAt,
    latest: storedVersion(state.latestVersion),
  };
}

async function rememberCheck(
  payload: Payload,
  data: { latestCheckedAt: string; latestVersion?: string }
): Promise<void> {
  await payload.updateGlobal({
    data,
    depth: 0,
    overrideAccess: true,
    slug: "install-state",
  });
}

async function fetchLatest(
  fetchImpl: typeof fetch,
  url: string
): Promise<string | null> {
  const response = await fetchImpl(url, {
    headers: {
      accept: "application/vnd.github+json",
      "user-agent": `bordful/${BORDFUL_VERSION}`,
      "x-github-api-version": "2022-11-28",
    },
    signal: AbortSignal.timeout(3000),
  });

  if (!response.ok) {
    throw new Error(`Release check failed with status ${response.status}`);
  }

  const body: unknown = await response.json();
  return pickLatestRelease(body);
}

export async function checkForUpdate(
  payload: Payload,
  deps: UpdateCheckDeps = {}
): Promise<UpdateCheckResult> {
  const now = deps.now ?? new Date();
  const state = await readInstallState(payload);
  if (isFresh(state.checkedAt, now)) {
    return toResult(state.latest);
  }

  const url =
    deps.url ?? process.env.BORDFUL_RELEASES_URL ?? DEFAULT_RELEASES_URL;
  const fetchImpl = deps.fetch ?? fetch;
  const checkedAt = now.toISOString();

  try {
    const found = await fetchLatest(fetchImpl, url);
    const latest = found ?? state.latest;
    await rememberCheck(
      payload,
      found === null
        ? { latestCheckedAt: checkedAt }
        : { latestCheckedAt: checkedAt, latestVersion: found }
    );
    return toResult(latest);
  } catch {
    // Record the attempt so a downed release host is not hit on every admin view.
    try {
      await rememberCheck(payload, { latestCheckedAt: checkedAt });
    } catch {
      return toResult(state.latest);
    }

    return toResult(state.latest);
  }
}
