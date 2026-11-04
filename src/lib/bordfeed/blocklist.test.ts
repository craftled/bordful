import { expect, test } from "vitest";

import {
  type BlockableJob,
  isBlocked,
  isEmptyBlocklist,
  parseBlocklist,
} from "./blocklist";

function job(overrides: Partial<BlockableJob> = {}): BlockableJob {
  return {
    applyUrl: null,
    companyDomain: null,
    companyName: "Example Co",
    sourceListingUrl: null,
    summary: null,
    title: "Example Backend Engineer",
    ...overrides,
  };
}

test("parses one entry per line, trimmed, lowercased, without blanks", () => {
  const list = parseBlocklist({
    companies: "  Acme Example Ltd \n\nacme example ltd\r\nOther Co",
    domains: "https://Jobs.Example.org/path\nnot a domain\nexample.net",
    keywords: "Crypto\n unpaid internship ",
  });

  expect(list).toEqual({
    companies: ["acme example ltd", "other co"],
    domains: ["jobs.example.org", "example.net"],
    keywords: ["crypto", "unpaid internship"],
  });
  expect(isEmptyBlocklist(parseBlocklist(null))).toBe(true);
  expect(isEmptyBlocklist(list)).toBe(false);
});

test("blocks by exact company name, ignoring case", () => {
  const list = parseBlocklist({ companies: "Acme Example Ltd" });

  expect(isBlocked(job({ companyName: "ACME Example Ltd" }), list)).toBe(true);
  expect(isBlocked(job({ companyName: "Acme Example" }), list)).toBe(false);
  expect(isBlocked(job({ companyName: null }), list)).toBe(false);
});

test("blocks a domain and its subdomains across company, apply and source URLs", () => {
  const list = parseBlocklist({ domains: "example.org" });

  expect(isBlocked(job({ companyDomain: "example.org" }), list)).toBe(true);
  expect(
    isBlocked(job({ applyUrl: "https://careers.example.org/apply/1" }), list)
  ).toBe(true);
  expect(
    isBlocked(job({ sourceListingUrl: "https://example.org/jobs/1" }), list)
  ).toBe(true);
  expect(isBlocked(job({ companyDomain: "notexample.org" }), list)).toBe(false);
  expect(isBlocked(job({ applyUrl: "mailto:hr@example.org" }), list)).toBe(
    false
  );
});

test("blocks whole-word keywords and phrases in the title or summary", () => {
  const list = parseBlocklist({ keywords: "java\nunpaid internship" });

  expect(isBlocked(job({ title: "Senior Java Developer" }), list)).toBe(true);
  expect(isBlocked(job({ title: "JavaScript Developer" }), list)).toBe(false);
  expect(
    isBlocked(job({ summary: "This is an unpaid internship, 3 months." }), list)
  ).toBe(true);
  expect(isBlocked(job({ summary: "A paid internship." }), list)).toBe(false);
});

test("an empty blocklist blocks nothing", () => {
  expect(isBlocked(job(), parseBlocklist({}))).toBe(false);
});
