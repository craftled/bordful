import type { JobWorkplaceType } from "@/lib/domain/job-vocab";

const TRAILING_POINT_ZERO = /\.0$/;
const K_THRESHOLD = 10_000;
const M_THRESHOLD = 1_000_000;
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_MONTH = 30 * MS_PER_DAY;
const NEW_JOB_MS = 48 * MS_PER_HOUR;
const MULTI_LOCATION_SEPARATOR = "; ";

export interface SalaryFields {
  salaryCurrency?: string | null;
  salaryMax?: number | null;
  salaryMin?: number | null;
}

export interface LocationFields {
  locationDisplay: string | null;
  remoteRegion: string | null;
  workplaceType: JobWorkplaceType | null;
}

function finiteAmount(value: number | null | undefined): number | null {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function compactNumber(num: number, scale?: "k" | "M"): string {
  if (scale === "M" || (scale === undefined && num >= M_THRESHOLD)) {
    return `${(num / M_THRESHOLD).toFixed(1).replace(TRAILING_POINT_ZERO, "")}M`;
  }
  if (scale === "k" || (scale === undefined && num >= K_THRESHOLD)) {
    return `${(num / 1000).toFixed(0)}k`;
  }

  return num.toLocaleString("en");
}

function currencySymbol(code: string): string {
  try {
    const part = new Intl.NumberFormat("en", {
      currency: code,
      currencyDisplay: "narrowSymbol",
      style: "currency",
    })
      .formatToParts(0)
      .find((item) => item.type === "currency");
    return part?.value ?? code;
  } catch {
    return code;
  }
}

export function formatSalary(job: SalaryFields): string {
  const min = finiteAmount(job.salaryMin);
  const max = finiteAmount(job.salaryMax);
  if (min === null && max === null) {
    return "";
  }

  let range: string;
  if (min !== null && max !== null && min !== max) {
    const larger = Math.max(min, max);
    let scale: "k" | "M" | undefined;
    if (larger >= M_THRESHOLD) {
      scale = "M";
    } else if (larger >= K_THRESHOLD) {
      scale = "k";
    }
    range = `${compactNumber(min, scale)}-${compactNumber(max, scale)}`;
  } else {
    range = compactNumber((min ?? max) as number);
  }

  const code = job.salaryCurrency?.trim().toUpperCase() ?? "";
  const symbol = code ? currencySymbol(code) : "";
  const codeSuffix = code && symbol !== code ? ` (${code})` : "";
  return `${symbol}${range}${codeSuffix}`;
}

function postedMs(iso: string): number | null {
  const value = Date.parse(iso);
  return Number.isNaN(value) ? null : value;
}

function pluralize(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`} ago`;
}

export function formatRelativePosted(iso: string, now = Date.now()): string {
  const posted = postedMs(iso);
  if (posted === null) {
    return "";
  }

  const age = Math.max(0, now - posted);
  if (age < MS_PER_MINUTE) {
    return "just now";
  }
  if (age < MS_PER_HOUR) {
    return pluralize(Math.floor(age / MS_PER_MINUTE), "minute");
  }
  if (age < MS_PER_DAY) {
    return pluralize(Math.floor(age / MS_PER_HOUR), "hour");
  }
  if (age < MS_PER_MONTH) {
    return pluralize(Math.floor(age / MS_PER_DAY), "day");
  }

  return new Date(posted).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
}

export function isNewJob(iso: string, now = Date.now()): boolean {
  const posted = postedMs(iso);
  if (posted === null) {
    return false;
  }

  const age = now - posted;
  return age >= 0 && age <= NEW_JOB_MS;
}

function compactLocation(locationDisplay: string | null): string {
  if (locationDisplay === null) {
    return "";
  }

  const places = locationDisplay
    .split(MULTI_LOCATION_SEPARATOR)
    .map((place) => place.trim())
    .filter((place) => place.length > 0);
  const [first] = places;
  if (first === undefined) {
    return "";
  }
  if (places.length === 1) {
    return first;
  }

  return `${first} +${places.length - 1}`;
}

export function formatLocation(card: LocationFields): string {
  if (card.workplaceType === "remote") {
    const region = card.remoteRegion?.trim() ?? "";
    return region.length > 0 ? `Remote (${region})` : "Remote";
  }

  const place = compactLocation(card.locationDisplay);
  if (card.workplaceType === "hybrid") {
    return place.length > 0 ? `Hybrid, ${place}` : "Hybrid";
  }
  if (place.length > 0) {
    return place;
  }

  return "Location not listed";
}
