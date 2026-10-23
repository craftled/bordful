import { expect, test } from "vitest";

import { isReservedJobSlug } from "@/lib/domain/reserved-slugs";

import {
  buildBoardPagePath,
  buildJobPath,
  buildTaxonomyArchivePath,
  isPublicJobSlug,
} from "./paths";

test("builds board, job, and taxonomy paths", () => {
  expect(buildBoardPagePath(false, 1)).toBe("/");
  expect(buildBoardPagePath(true, 1)).toBe("/jobs");
  expect(buildBoardPagePath(false, 2)).toBe("/jobs/page/2");
  expect(buildBoardPagePath(true, 3)).toBe("/jobs/page/3");
  expect(buildJobPath("example-role")).toBe("/jobs/example-role");
  expect(buildTaxonomyArchivePath("type", "full-time")).toBe(
    "/jobs/type/full-time"
  );
  expect(buildTaxonomyArchivePath("level", "C-Level")).toBe(
    "/jobs/level/c-level"
  );
  expect(buildTaxonomyArchivePath("location", "US")).toBe("/jobs/location/us");
  expect(buildTaxonomyArchivePath("type", "contract", 2)).toBe(
    "/jobs/type/contract/page/2"
  );
});

test("accepts public job slugs and keeps reserved route words", () => {
  expect(isPublicJobSlug("ok-slug-1")).toBe(true);
  expect(isPublicJobSlug("Bad_Slug")).toBe(false);
  expect(isPublicJobSlug("%2e%2e")).toBe(false);
  expect(isPublicJobSlug("-x")).toBe(false);
  expect(isReservedJobSlug("search")).toBe(true);
});
