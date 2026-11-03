import {
  JOB_EMPLOYMENT_TYPES,
  type JobEmploymentType,
  type JobSeniority,
  SALARY_BAND_IDS,
  type SalaryBandId,
  SENIORITIES,
} from "@/lib/domain/job-vocab";

const PAGE_RE = /^-?\d+$/;
const PER_PAGE_RE = /^\d+$/;

export const PER_PAGE_OPTIONS = [10, 20, 50, 100] as const;

export type BoardSort = "newest" | "oldest" | "salary";

export interface BoardQuery {
  languages: string[];
  page: number;
  perPage: number;
  q: string;
  remote: boolean;
  salary: SalaryBandId[];
  seniority: JobSeniority[];
  sort: BoardSort;
  types: JobEmploymentType[];
  visa: boolean;
}

export interface BoardQueryOptions {
  defaultPerPage: number;
}

export type BoardSearchParams = Record<string, string | string[] | undefined>;

const Q_MAX = 200;
const PER_PAGE_SET = new Set<number>(PER_PAGE_OPTIONS);
const SORTS = new Set<BoardSort>(["newest", "oldest", "salary"]);

function splitCsv(value: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function parseEnum<T extends string>(
  values: string[],
  allowed: readonly T[]
): T[] {
  const allowedSet = new Set<string>(allowed);
  const seen = new Set<string>();
  const result: T[] = [];

  for (const value of values) {
    if (!allowedSet.has(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value as T);
  }

  return result;
}

function parseLanguages(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const language = value.trim().toLowerCase();
    if (language.length === 0 || seen.has(language)) {
      continue;
    }
    seen.add(language);
    result.push(language);
  }

  return result;
}

function parsePage(raw: string | null): number {
  if (raw === null || !PAGE_RE.test(raw)) {
    return 1;
  }

  const page = Number.parseInt(raw, 10);
  return page > 0 ? page : 1;
}

function parsePerPage(raw: string | null, defaultPerPage: number): number {
  if (raw === null || !PER_PAGE_RE.test(raw)) {
    return defaultPerPage;
  }

  const perPage = Number.parseInt(raw, 10);
  if (perPage === defaultPerPage || !PER_PAGE_SET.has(perPage)) {
    return defaultPerPage;
  }

  return perPage;
}

function parseSort(raw: string | null): BoardSort {
  if (raw !== null && SORTS.has(raw as BoardSort)) {
    return raw as BoardSort;
  }

  return "newest";
}

export function parseBoardQuery(
  params: URLSearchParams,
  options: BoardQueryOptions
): BoardQuery {
  return {
    languages: parseLanguages(splitCsv(params.get("languages"))),
    page: parsePage(params.get("page")),
    perPage: parsePerPage(params.get("per_page"), options.defaultPerPage),
    q: (params.get("q") ?? "").trim().slice(0, Q_MAX),
    remote: params.get("remote") === "true",
    salary: parseEnum(splitCsv(params.get("salary")), SALARY_BAND_IDS),
    seniority: parseEnum(splitCsv(params.get("roles")), SENIORITIES),
    sort: parseSort(params.get("sort")),
    types: parseEnum(splitCsv(params.get("types")), JOB_EMPLOYMENT_TYPES),
    visa: params.get("visa") === "true",
  };
}

export function serializeBoardQuery(
  query: BoardQuery,
  options: BoardQueryOptions
): URLSearchParams {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }
  if (query.types.length > 0) {
    params.set("types", query.types.join(","));
  }
  if (query.seniority.length > 0) {
    params.set("roles", query.seniority.join(","));
  }
  if (query.remote) {
    params.set("remote", "true");
  }
  if (query.salary.length > 0) {
    params.set("salary", query.salary.join(","));
  }
  if (query.visa) {
    params.set("visa", "true");
  }
  if (query.languages.length > 0) {
    params.set("languages", query.languages.join(","));
  }
  if (query.sort !== "newest") {
    params.set("sort", query.sort);
  }
  if (query.perPage !== options.defaultPerPage) {
    params.set("per_page", String(query.perPage));
  }
  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params;
}

export function urlSearchParamsFromRecord(
  record: BoardSearchParams
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string") {
      params.append(key, value);
      continue;
    }
    if (!Array.isArray(value)) {
      continue;
    }
    const [first] = value;
    if (first !== undefined) {
      params.append(key, first);
    }
  }

  return params;
}

export function boardQueryFromSearchParams(
  record: BoardSearchParams,
  options: BoardQueryOptions
): BoardQuery {
  return parseBoardQuery(urlSearchParamsFromRecord(record), options);
}

export function boardQueryHasFilters(query: BoardQuery): boolean {
  return (
    query.q.length > 0 ||
    query.types.length > 0 ||
    query.seniority.length > 0 ||
    query.remote ||
    query.salary.length > 0 ||
    query.visa ||
    query.languages.length > 0
  );
}

export function clearBoardFilters(query: BoardQuery): BoardQuery {
  return {
    languages: [],
    page: 1,
    perPage: query.perPage,
    q: "",
    remote: false,
    salary: [],
    seniority: [],
    sort: query.sort,
    types: [],
    visa: false,
  };
}
