import type { JobAlertQuery, SalaryBandId } from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

// Duplicated from the board on purpose. Lanes do not share filter code.
const SALARY_BANDS: Record<
  SalaryBandId,
  {
    max: number | null;
    maxExclusive: boolean;
    min: number;
    minExclusive: boolean;
  }
> = {
  "< $50K": { max: 50_000, maxExclusive: true, min: 0, minExclusive: false },
  "> $200K": {
    max: null,
    maxExclusive: false,
    min: 200_000,
    minExclusive: true,
  },
  "$50K - $100K": {
    max: 100_000,
    maxExclusive: false,
    min: 50_000,
    minExclusive: false,
  },
  "$100K - $200K": {
    max: 200_000,
    maxExclusive: false,
    min: 100_000,
    minExclusive: true,
  },
};

const VISA_DECLINED = new Set(["false", "no", "none"]);

function usdRange(job: JobListItem): { max: number; min: number } | null {
  const { salaryMaxUsd, salaryMinUsd } = job;
  if (salaryMaxUsd === null && salaryMinUsd === null) {
    return null;
  }

  const low = salaryMinUsd ?? salaryMaxUsd;
  const high = salaryMaxUsd ?? salaryMinUsd;
  if (low === null || high === null) {
    return null;
  }

  return low <= high ? { max: high, min: low } : { max: low, min: high };
}

function bandOverlaps(
  range: { max: number; min: number },
  bandId: SalaryBandId
): boolean {
  const band = SALARY_BANDS[bandId];
  const startsBeforeEnd =
    band.max === null ||
    (band.maxExclusive ? range.min < band.max : range.min <= band.max);
  const endsAfterStart = band.minExclusive
    ? range.max > band.min
    : range.max >= band.min;
  return startsBeforeEnd && endsAfterStart;
}

function matchesSalary(job: JobListItem, bands: SalaryBandId[]): boolean {
  if (bands.length === 0) {
    return true;
  }

  const range = usdRange(job);
  if (range === null) {
    return false;
  }

  return bands.some((band) => bandOverlaps(range, band));
}

function offersVisa(value: string | null): boolean {
  if (value === null) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return false;
  }

  return !VISA_DECLINED.has(normalized);
}

function sharesLanguage(job: JobListItem, languages: string[]): boolean {
  if (languages.length === 0) {
    return true;
  }

  const owned = new Set(
    job.languages.map((language) => language.toLowerCase())
  );
  return languages.some((language) => owned.has(language.toLowerCase()));
}

export function matchesAlertQuery(
  job: JobListItem,
  query: JobAlertQuery
): boolean {
  if (
    query.types.length > 0 &&
    (job.employmentType === null || !query.types.includes(job.employmentType))
  ) {
    return false;
  }

  if (
    query.seniority.length > 0 &&
    (job.seniority === null || !query.seniority.includes(job.seniority))
  ) {
    return false;
  }

  if (!sharesLanguage(job, query.languages)) {
    return false;
  }

  if (query.remote && job.workplaceType !== "remote") {
    return false;
  }

  if (query.visa && !offersVisa(job.visaSponsorship)) {
    return false;
  }

  return matchesSalary(job, query.salary);
}
