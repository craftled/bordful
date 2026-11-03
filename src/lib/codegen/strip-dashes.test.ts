import { expect, test } from "vitest";

import { stripDashes } from "./strip-dashes";

test("replaces em and en dashes, including the space around them", () => {
  const input = "Generated \u2014 types \u2013 stay readable.";
  expect(stripDashes(input)).toBe("Generated, types, stay readable.");
});
