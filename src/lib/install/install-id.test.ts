import { expect, test } from "vitest";

import { bordfeedInstallId } from "./install-id";

test("bordfeedInstallId hashes the local install id", () => {
  expect(bordfeedInstallId("ab".repeat(32))).toBe(
    "271a413bd339c5709fdceaec41f14f11e9fbfb5042d72d331c65f32b284cd09a"
  );
});
