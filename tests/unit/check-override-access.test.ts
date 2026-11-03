import { expect, test } from "vitest";

import { findViolations } from "../../scripts/check-override-access";

test("flags a local API call that omits overrideAccess", () => {
  expect(
    findViolations('payload.find({ collection: "jobs" })', "a.ts")
  ).toEqual([{ call: "payload.find", file: "a.ts", line: 1 }]);
});

test("accepts an explicit overrideAccess flag", () => {
  expect(
    findViolations(
      'payload.find({ collection: "jobs", overrideAccess: false })',
      "a.ts"
    )
  ).toEqual([]);
});

test("accepts a multiline call that sets overrideAccess", () => {
  expect(
    findViolations(
      `req.payload.findByID({
 id,
 collection: "x",
 overrideAccess: true,
})`,
      "a.ts"
    )
  ).toEqual([]);
});

test("flags a jobs queue call", () => {
  expect(findViolations('payload.jobs.queue({ task: "x" })', "a.ts")).toEqual([
    { call: "payload.jobs.queue", file: "a.ts", line: 1 },
  ]);
});

test("ignores a call written inside a template literal", () => {
  expect(findViolations("const value = `payload.find(`;\n", "a.ts")).toEqual(
    []
  );
});
