import { expect, test } from "vitest";

import { isMarketingEnabled } from "./flags";

test("marketing is on only for the exact string true", () => {
  expect(isMarketingEnabled({ BORDFUL_MARKETING: "true" })).toBe(true);

  for (const value of ["TRUE", "1", "yes", "", " true", undefined]) {
    expect(isMarketingEnabled({ BORDFUL_MARKETING: value })).toBe(false);
  }
});
