import {
  EMPTY_JOB_ALERT_QUERY,
  JOB_EMPLOYMENT_LABELS,
  JOB_EMPLOYMENT_TYPES,
  type JobAlertQuery,
  type JobSeniority,
  SALARY_BAND_IDS,
  SENIORITIES,
} from "@/lib/domain/job-vocab";

const SENIORITY_LABELS: Record<JobSeniority, string> = {
  c_level: "C level",
  director: "Director",
  entry: "Entry",
  intern: "Intern",
  lead: "Lead",
  mid: "Mid",
  principal: "Principal",
  senior: "Senior",
  vp: "VP",
};

function splitValues(values: readonly string[]): string[] {
  const parts: string[] = [];
  for (const value of values) {
    for (const part of value.split(",")) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
    }
  }
  return parts;
}

function uniqueChoices<T extends string>(
  allowed: readonly T[],
  values: readonly string[]
): T[] {
  const permitted = new Set<string>(allowed);
  const seen = new Set<string>();
  const picked: T[] = [];
  for (const value of values) {
    if (!permitted.has(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    picked.push(value as T);
  }
  return picked;
}

function uniqueLanguages(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const picked: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > 40 || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    picked.push(trimmed);
    if (picked.length === 20) {
      break;
    }
  }
  return picked;
}

function flagValue(value: unknown): boolean {
  return value === true || value === "on" || value === "true";
}

function stringValues(value: unknown): string[] {
  if (typeof value === "string") {
    return splitValues([value]);
  }
  if (!Array.isArray(value)) {
    return [];
  }
  const strings = value.filter(
    (item): item is string => typeof item === "string"
  );
  return splitValues(strings);
}

function formValues(formData: FormData, key: string): string[] {
  const raw: string[] = [];
  for (const value of formData.getAll(key)) {
    if (typeof value === "string") {
      raw.push(value);
    }
  }
  return splitValues(raw);
}

function formFlag(formData: FormData, key: string): boolean {
  for (const value of formData.getAll(key)) {
    if (flagValue(value)) {
      return true;
    }
  }
  return false;
}

export function buildAlertQuery(input: {
  languages: readonly string[];
  remote: boolean;
  salary: readonly string[];
  seniority: readonly string[];
  types: readonly string[];
  visa: boolean;
}): JobAlertQuery {
  return {
    languages: uniqueLanguages(input.languages),
    remote: input.remote,
    salary: uniqueChoices(SALARY_BAND_IDS, input.salary),
    seniority: uniqueChoices(SENIORITIES, input.seniority),
    types: uniqueChoices(JOB_EMPLOYMENT_TYPES, input.types),
    visa: input.visa,
  };
}

export function parseAlertQueryFromFormData(formData: FormData): JobAlertQuery {
  return buildAlertQuery({
    languages: formValues(formData, "languages"),
    remote: formFlag(formData, "remote"),
    salary: formValues(formData, "salary"),
    seniority: formValues(formData, "seniority"),
    types: formValues(formData, "types"),
    visa: formFlag(formData, "visa"),
  });
}

export function parseAlertQueryFromUnknown(value: unknown): JobAlertQuery {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return EMPTY_JOB_ALERT_QUERY;
  }

  const record = value as Record<string, unknown>;
  return buildAlertQuery({
    languages: stringValues(record.languages),
    remote: flagValue(record.remote),
    salary: stringValues(record.salary),
    seniority: stringValues(record.seniority),
    types: stringValues(record.types),
    visa: flagValue(record.visa),
  });
}

export function parseAlertQueryFromSearchParams(
  params: URLSearchParams
): JobAlertQuery {
  const formData = new FormData();
  for (const [key, value] of params.entries()) {
    formData.append(key, value);
  }
  return parseAlertQueryFromFormData(formData);
}

export function firstSearchValue(
  value: string | string[] | undefined
): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function alertQueryJson(query: JobAlertQuery): Record<string, unknown> {
  return {
    languages: [...query.languages],
    remote: query.remote,
    salary: [...query.salary],
    seniority: [...query.seniority],
    types: [...query.types],
    visa: query.visa,
  };
}

export function alertQueryHasFilters(query: JobAlertQuery): boolean {
  return (
    query.remote ||
    query.visa ||
    query.types.length > 0 ||
    query.seniority.length > 0 ||
    query.salary.length > 0 ||
    query.languages.length > 0
  );
}

function joinLabels(labels: readonly string[]): string {
  return labels.join(" or ");
}

export function describeAlertQuery(query: JobAlertQuery): string {
  const parts: string[] = [];
  if (query.remote) {
    parts.push("Remote");
  }
  if (query.visa) {
    parts.push("Visa sponsorship");
  }
  if (query.types.length > 0) {
    parts.push(
      joinLabels(query.types.map((type) => JOB_EMPLOYMENT_LABELS[type]))
    );
  }
  if (query.seniority.length > 0) {
    parts.push(
      joinLabels(query.seniority.map((level) => SENIORITY_LABELS[level]))
    );
  }
  if (query.salary.length > 0) {
    parts.push(joinLabels(query.salary));
  }
  if (query.languages.length > 0) {
    parts.push(query.languages.join(", "));
  }
  if (parts.length === 0) {
    return "All new jobs";
  }
  return parts.join(", ");
}
