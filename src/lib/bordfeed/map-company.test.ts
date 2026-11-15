import { expect, test } from "vitest";

import { domainFromWebsite } from "./map-company";

test("domainFromWebsite accepts and normalizes HTTP website hosts", () => {
  expect(domainFromWebsite("https://www.CVSHealth.com/careers?x=1")).toBe(
    "cvshealth.com"
  );
  expect(domainFromWebsite("http://acme.example")).toBe("acme.example");
});

test("domainFromWebsite rejects non-HTTP URLs and invalid values", () => {
  for (const value of [
    "ftp://acme.example",
    "not a url",
    "",
    null,
    42,
    "https://localhost:3000",
  ]) {
    expect(domainFromWebsite(value)).toBeNull();
  }
});
