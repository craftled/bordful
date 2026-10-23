import { expect, test } from "vitest";

import { changelogEntries } from "./changelog-entries";

test("changelog starts at 1.0.0-beta.1 and names Airtable only on the legacy title", () => {
  expect(changelogEntries[0]?.version).toBe("1.0.0-beta.1");

  for (const entry of changelogEntries) {
    const text = [
      entry.version,
      entry.date ?? "",
      entry.href ?? "",
      ...entry.bullets,
    ];
    for (const part of text) {
      expect(part.includes("Airtable")).toBe(false);
    }

    if (entry.title !== "0.1.x (Airtable edition)") {
      expect(entry.title.includes("Airtable")).toBe(false);
    }
  }

  expect(
    changelogEntries.some((entry) => entry.title === "0.1.x (Airtable edition)")
  ).toBe(true);
});
