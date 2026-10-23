import { expect, test } from "vitest";

import { compareVersions, pickLatestRelease } from "./version";

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
    pickLatestRelease([
      { draft: false, tag_name: "v1.0.0-beta.2" },
      { draft: false, tag_name: "v1.0.0-beta.10" },
      { draft: true, tag_name: "v2.0.0" },
      { draft: false, tag_name: "legacy-final" },
    ])
  ).toBe("1.0.0-beta.10");
  expect(pickLatestRelease({})).toBeNull();
  expect(pickLatestRelease([])).toBeNull();
});
