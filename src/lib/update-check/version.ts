const NUMERIC_IDENTIFIER = /^(?:0|[1-9]\d*)$/;
const ALPHA_MARK = /[A-Za-z-]/;
const VERSION_PATTERN =
  /^(?:v)?(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<pre>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

type IdentifierKind = "alpha" | "numeric";

interface ParsedVersion {
  major: string;
  minor: string;
  patch: string;
  pre: string[] | null;
}

function identifierKind(identifier: string): IdentifierKind | null {
  if (NUMERIC_IDENTIFIER.test(identifier)) {
    return "numeric";
  }

  if (ALPHA_MARK.test(identifier)) {
    return "alpha";
  }

  return null;
}

function parseVersion(input: string): ParsedVersion | null {
  const match = VERSION_PATTERN.exec(input);
  const major = match?.groups?.major;
  const minor = match?.groups?.minor;
  const patch = match?.groups?.patch;
  if (major === undefined || minor === undefined || patch === undefined) {
    return null;
  }

  const preRaw = match?.groups?.pre;
  if (preRaw === undefined) {
    return { major, minor, patch, pre: null };
  }

  const pre = preRaw.split(".");
  for (const identifier of pre) {
    if (identifierKind(identifier) === null) {
      return null;
    }
  }

  return { major, minor, patch, pre };
}

function compareNumeric(left: string, right: string): -1 | 0 | 1 {
  if (left.length !== right.length) {
    return left.length < right.length ? -1 : 1;
  }

  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function compareIdentifiers(left: string, right: string): -1 | 0 | 1 | null {
  const leftKind = identifierKind(left);
  const rightKind = identifierKind(right);
  if (leftKind === null || rightKind === null) {
    return null;
  }

  if (leftKind === "numeric" && rightKind === "numeric") {
    return compareNumeric(left, right);
  }

  if (leftKind === "numeric") {
    return -1;
  }

  if (rightKind === "numeric") {
    return 1;
  }

  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
}

function comparePrerelease(
  left: string[] | null,
  right: string[] | null
): -1 | 0 | 1 | null {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  const count = Math.min(left.length, right.length);
  for (let index = 0; index < count; index += 1) {
    const leftId = left[index];
    const rightId = right[index];
    if (leftId === undefined || rightId === undefined) {
      return null;
    }

    const compared = compareIdentifiers(leftId, rightId);
    if (compared === null || compared !== 0) {
      return compared;
    }
  }

  if (left.length === right.length) {
    return 0;
  }

  return left.length < right.length ? -1 : 1;
}

export function compareVersions(a: string, b: string): -1 | 0 | 1 | null {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (left === null || right === null) {
    return null;
  }

  const major = compareNumeric(left.major, right.major);
  if (major !== 0) {
    return major;
  }

  const minor = compareNumeric(left.minor, right.minor);
  if (minor !== 0) {
    return minor;
  }

  const patch = compareNumeric(left.patch, right.patch);
  if (patch !== 0) {
    return patch;
  }

  return comparePrerelease(left.pre, right.pre);
}

function releaseRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function versionFromTag(tag: string): string | null {
  if (parseVersion(tag) === null) {
    return null;
  }

  return tag.startsWith("v") ? tag.slice(1) : tag;
}

export function pickLatestRelease(releases: unknown): string | null {
  if (!Array.isArray(releases)) {
    return null;
  }

  let latest: string | null = null;
  for (const release of releases) {
    const record = releaseRecord(release);
    if (record === null || record.draft === true) {
      continue;
    }

    const { tag_name: tagName } = record;
    if (typeof tagName !== "string") {
      continue;
    }

    const version = versionFromTag(tagName);
    if (version === null) {
      continue;
    }

    if (latest === null || compareVersions(version, latest) === 1) {
      latest = version;
    }
  }

  return latest;
}
