import { normalizeDomain } from "./map-company";

// The admin's import blocklist, parsed. Each list comes from a textarea with
// one entry per line. Matching is case-insensitive.
export interface Blocklist {
  companies: string[];
  domains: string[];
  keywords: string[];
}

export interface BlocklistInput {
  companies?: string | null;
  domains?: string | null;
  keywords?: string | null;
}

// The parts of a job the blocklist looks at.
export interface BlockableJob {
  applyUrl: string | null;
  companyDomain: string | null;
  companyName: string | null;
  sourceListingUrl: string | null;
  summary: string | null;
  title: string;
}

export const EMPTY_BLOCKLIST: Blocklist = {
  companies: [],
  domains: [],
  keywords: [],
};

const LINE_BREAK = /\r?\n/u;

function lines(value: string | null | undefined): string[] {
  if (typeof value !== "string") {
    return [];
  }

  const seen = new Set<string>();
  for (const line of value.split(LINE_BREAK)) {
    const entry = line.trim().toLowerCase();
    if (entry.length > 0) {
      seen.add(entry);
    }
  }

  return [...seen];
}

export function parseBlocklist(input: BlocklistInput | null | undefined) {
  return {
    companies: lines(input?.companies),
    domains: lines(input?.domains).flatMap((entry) => {
      const domain = normalizeDomain(entry);
      return domain ? [domain] : [];
    }),
    keywords: lines(input?.keywords),
  } satisfies Blocklist;
}

export function isEmptyBlocklist(list: Blocklist): boolean {
  return (
    list.companies.length === 0 &&
    list.domains.length === 0 &&
    list.keywords.length === 0
  );
}

function hostOf(value: string | null): string | null {
  return value ? normalizeDomain(value) : null;
}

// A blocked domain also covers its subdomains: example.com blocks
// jobs.example.com, not notexample.com.
function hostBlocked(host: string | null, domains: string[]): boolean {
  if (!host) {
    return false;
  }

  return domains.some(
    (domain) => host === domain || host.endsWith(`.${domain}`)
  );
}

const WORD = /[\p{L}\p{N}]/u;

// Whole words only, so "java" does not block "JavaScript". A keyword can be
// a phrase ("unpaid internship").
function hasKeyword(text: string, keyword: string): boolean {
  let from = 0;
  while (from <= text.length) {
    const at = text.indexOf(keyword, from);
    if (at === -1) {
      return false;
    }

    const before = text[at - 1] ?? "";
    const after = text[at + keyword.length] ?? "";
    if (!(WORD.test(before) || WORD.test(after))) {
      return true;
    }

    from = at + 1;
  }

  return false;
}

export function isBlocked(job: BlockableJob, list: Blocklist): boolean {
  const company = job.companyName?.trim().toLowerCase() ?? "";
  if (company.length > 0 && list.companies.includes(company)) {
    return true;
  }

  const hosts = [
    job.companyDomain ? normalizeDomain(job.companyDomain) : null,
    hostOf(job.applyUrl),
    hostOf(job.sourceListingUrl),
  ];
  if (hosts.some((host) => hostBlocked(host, list.domains))) {
    return true;
  }

  const text = `${job.title}\n${job.summary ?? ""}`.toLowerCase();
  return list.keywords.some((keyword) => hasKeyword(text, keyword));
}
