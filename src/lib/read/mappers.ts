import {
  ALERT_FREQUENCIES,
  type AlertFrequency,
  CAREER_LEVELS,
  JOB_EMPLOYMENT_TYPES,
  JOB_ORIGINS,
  JOB_WORKPLACE_TYPES,
  type JobOrigin,
  SENIORITIES,
} from "@/lib/domain/job-vocab";
import { resolveThemeTokens } from "@/theme/tokens";

import { isIndexable } from "./indexable";
import {
  type BordfeedConnectionPublic,
  type CompanyDetail,
  type CompanySummary,
  type JobDetail,
  type JobListItem,
  PUBLIC_DETAIL_FIELDS,
  type PublicDetailField,
  type SiteSettingsView,
} from "./types";

function record(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function oneOf<T extends string>(
  values: readonly T[],
  value: unknown
): T | null {
  if (typeof value === "string" && values.includes(value as T)) {
    return value as T;
  }

  return null;
}

function jobOrigin(value: unknown): JobOrigin {
  return oneOf(JOB_ORIGINS, value) ?? "manual";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: string[] = [];
  for (const item of value) {
    if (item !== null && typeof item === "object" && "value" in item) {
      const entry = item.value;
      if (typeof entry === "string") {
        items.push(entry);
      }
    }
  }

  return items;
}

function choiceList<T extends string>(
  values: readonly T[],
  value: unknown
): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: T[] = [];
  for (const item of value) {
    const choice = oneOf(values, item);
    if (choice !== null) {
      items.push(choice);
    }
  }

  return items;
}

function mediaUrl(value: unknown): string | null {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const media = value as {
    url?: unknown;
    variants?: { card?: { url?: unknown } };
  };
  const card = media.variants?.card?.url;
  if (typeof card === "string") {
    return card;
  }

  return typeof media.url === "string" ? media.url : null;
}

function companyLogoFallback(company: unknown): string | null {
  if (company === null || typeof company !== "object") {
    return null;
  }

  const { logoUrl } = record(company);
  return typeof logoUrl === "string" ? logoUrl : null;
}

function dateOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

export function toCompanySummary(doc: unknown): CompanySummary {
  const row = record(doc);

  return {
    careersUrl: stringOrNull(row.careersUrl),
    domain: stringOrNull(row.domain),
    headcount: numberOrNull(row.headcount),
    id: String(row.id),
    industry: stringOrNull(row.industry),
    linkedinUrl: stringOrNull(row.linkedinUrl),
    location: stringOrNull(row.location),
    logoUrl: mediaUrl(row.logo) ?? stringOrNull(row.logoUrl),
    name: stringOrNull(row.name) ?? "",
    slug: stringOrNull(row.slug) ?? "",
    twitterUrl: stringOrNull(row.twitterUrl),
    website: stringOrNull(row.website),
  };
}

export function toJobListItem(doc: unknown): JobListItem {
  const row = record(doc);
  const origin = jobOrigin(row.origin);

  return {
    careerLevel: choiceList(CAREER_LEVELS, row.careerLevel),
    categories: stringList(row.categories),
    companyLogoUrl:
      mediaUrl(row.companyLogo) ?? companyLogoFallback(row.company),
    companyName: stringOrNull(row.companyName) ?? "",
    companySlug: stringOrNull(row.companySlug),
    countryCode: stringOrNull(row.countryCode),
    employmentType: oneOf(JOB_EMPLOYMENT_TYPES, row.employmentType),
    featured: row.featured === true,
    id: String(row.id),
    indexable: isIndexable({ origin }),
    languages: stringList(row.languages),
    locationDisplay: stringOrNull(row.locationDisplay),
    origin,
    publishedAt: dateOrNull(row.publishedAt),
    remoteRegion: stringOrNull(row.remoteRegion),
    salaryCurrency: stringOrNull(row.salaryCurrency),
    salaryMax: numberOrNull(row.salaryMax),
    salaryMaxUsd: numberOrNull(row.salaryMaxUsd),
    salaryMin: numberOrNull(row.salaryMin),
    salaryMinUsd: numberOrNull(row.salaryMinUsd),
    seniority: oneOf(SENIORITIES, row.seniority),
    slug: stringOrNull(row.slug) ?? "",
    title: stringOrNull(row.title) ?? "",
    validThrough: dateOrNull(row.validThrough),
    visaSponsorship: stringOrNull(row.visaSponsorship),
    workplaceType: oneOf(JOB_WORKPLACE_TYPES, row.workplaceType),
  };
}

function populatedCompany(value: unknown): CompanySummary | null {
  if (value === null || typeof value !== "object" || !("slug" in value)) {
    return null;
  }

  return toCompanySummary(value);
}

export function toJobDetail(doc: unknown): JobDetail {
  const row = record(doc);

  return {
    ...toJobListItem(doc),
    applyEmail: stringOrNull(row.applyEmail),
    applyMethod: stringOrNull(row.applyMethod),
    applyUrl: stringOrNull(row.applyUrl),
    company: populatedCompany(row.company),
    description: row.description ?? null,
    locality: stringOrNull(row.locality),
    region: stringOrNull(row.region),
    sourceListingUrl: stringOrNull(row.sourceListingUrl),
    visaSponsorship: stringOrNull(row.visaSponsorship),
  };
}

export function toCompanyDetail(doc: unknown): CompanyDetail {
  return {
    ...toCompanySummary(doc),
    description: record(doc).description ?? null,
  };
}

function detailFields(value: unknown): PublicDetailField[] {
  if (!Array.isArray(value)) {
    return [...PUBLIC_DETAIL_FIELDS];
  }

  return choiceList(PUBLIC_DETAIL_FIELDS, value);
}

function frequency(value: unknown): AlertFrequency {
  return oneOf(ALERT_FREQUENCIES, value) ?? "weekly";
}

export function toSiteSettingsView(doc: unknown): SiteSettingsView {
  const row = record(doc);
  const theme = record(row.theme);
  const board = record(row.board);
  const postJob = record(row.postJob);
  const alerts = record(row.alerts);
  const showcase = record(row.showcase);

  return {
    alerts: {
      defaultFrequency: frequency(alerts.defaultFrequency),
      enabled: alerts.enabled === true,
      fromEmail: stringOrNull(alerts.fromEmail),
      fromName: stringOrNull(alerts.fromName) ?? "",
    },
    board: {
      description: stringOrNull(board.description) ?? "",
      jobsPerPage: numberOrNull(board.jobsPerPage) ?? 20,
      publicDetailFields: detailFields(board.publicDetailFields),
      title: stringOrNull(board.title) ?? "",
    },
    logoUrl: mediaUrl(row.logo),
    name: stringOrNull(row.name) ?? "Job Board",
    postJob: {
      durationDays: numberOrNull(postJob.durationDays) ?? 30,
      enabled: postJob.enabled === true,
      paymentLinkUrl: stringOrNull(postJob.paymentLinkUrl) ?? "",
      priceLabel: stringOrNull(postJob.priceLabel) ?? "",
    },
    showcase: {
      listMyBoard: showcase.listMyBoard === true,
    },
    tagline: stringOrNull(row.tagline) ?? "",
    theme: resolveThemeTokens({
      colors: record(theme.colors),
      fontBody: theme.fontBody,
      fontHeading: theme.fontHeading,
      radius: theme.radius,
    }),
  };
}

const CONNECTION_STATES = [
  "sample",
  "awaiting_code",
  "connected",
  "error",
] as const;

export function toBordfeedConnectionPublic(
  doc: unknown
): BordfeedConnectionPublic {
  const row = record(doc);
  const state = oneOf(CONNECTION_STATES, row.state) ?? "sample";

  return {
    lastSyncAt: dateOrNull(row.lastSyncAt),
    showAttribution: state !== "connected" || row.showAttribution !== false,
    state,
    templateId: stringOrNull(row.templateId) ?? "engineering-it",
  };
}
