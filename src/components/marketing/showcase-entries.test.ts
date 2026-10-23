import { expect, test } from "vitest";

import {
  SHOWCASE_COMMUNITY,
  SHOWCASE_DEMO,
  SHOWCASE_TEAM,
} from "./showcase-entries";

test("showcase starts with the live demo and empty opt-in lists", () => {
  expect(SHOWCASE_TEAM).toEqual([]);
  expect(SHOWCASE_COMMUNITY).toEqual([]);
  expect(SHOWCASE_DEMO.url).toBe("https://bordful.com/jobs");
});
