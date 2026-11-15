import { expect, test } from "vitest";

import { compareVersions, isPrerelease, pickLatestRelease } from "./version";

const comparisons: [string, string, -1 | 0 | 1 | null][] = [
  ["1.0.0-beta.1", "1.0.0-beta.2", -1],
  ["1.0.0-beta.2", "1.0.0", -1],
  ["1.0.0", "1.0.0", 0],
  ["v1.0.1", "1.0.0", 1],
  ["1.0.0-beta.10", "1.0.0-beta.9", 1],
  ["1.0.0-beta.1", "1.0.0-alpha.9", 1],
  ["1.0.0-beta", "1.0.0-beta.1", -1],
  ["1.0.0-1", "1.0.0-beta", -1],
  ["nope", "1.0.0", null],
  ["1.0", "1.0.0", null],
];

test.each(comparisons)(
  "compareVersions(%s, %s) is %s",
  (left, right, expected) => {
    expect(compareVersions(left, right)).toBe(expected);
  }
);

test("pickLatestRelease keeps the highest parsed tag and drops drafts", () => {
  expect(
    pickLatestRelease(
      [
        { draft: false, tag_name: "v1.0.0-beta.2" },
        { draft: false, tag_name: "v1.0.0-beta.10" },
        { draft: true, tag_name: "v2.0.0" },
        { draft: false, tag_name: "legacy-final" },
      ],
      { includePrereleases: true }
    )
  ).toBe("1.0.0-beta.10");
  expect(pickLatestRelease({})).toBeNull();
  expect(pickLatestRelease([])).toBeNull();
});

const WITH_BETA = [
  { draft: false, prerelease: true, tag_name: "v1.1.0-beta.1" },
  { draft: false, prerelease: false, tag_name: "v1.0.1" },
  { draft: false, prerelease: false, tag_name: "v1.0.0" },
];

test("a stable board is never offered a prerelease above it", () => {
  expect(pickLatestRelease(WITH_BETA)).toBe("1.0.1");
});

test("a semver prerelease tag is skipped even without the GitHub flag", () => {
  expect(
    pickLatestRelease([
      { draft: false, prerelease: false, tag_name: "v1.1.0-rc.1" },
      { draft: false, prerelease: false, tag_name: "v1.0.0" },
    ])
  ).toBe("1.0.0");
});

test("only prereleases above a stable board means no update", () => {
  expect(
    pickLatestRelease([
      { draft: false, prerelease: true, tag_name: "v1.1.0-beta.1" },
    ])
  ).toBeNull();
});

test("a board on a prerelease is offered newer prereleases", () => {
  expect(pickLatestRelease(WITH_BETA, { includePrereleases: true })).toBe(
    "1.1.0-beta.1"
  );
});

test("isPrerelease reads the semver prerelease part", () => {
  expect(isPrerelease("1.0.0")).toBe(false);
  expect(isPrerelease("1.1.0-beta.1")).toBe(true);
  expect(isPrerelease("nope")).toBe(false);
});
