import type { Payload } from "payload";

import {
  toBordfeedConnectionPublic,
  toCompanyDetail,
  toCompanySummary,
  toJobDetail,
  toJobListItem,
  toSiteSettingsView,
} from "./mappers";
import type {
  BordfeedConnectionPublic,
  CompanyDetail,
  CompanySummary,
  JobDetail,
  JobListItem,
  Paginated,
  SiteSettingsView,
} from "./types";

function paginate<T>(
  page: number,
  result: {
    docs: unknown[];
    page?: number;
    totalDocs: number;
    totalPages: number;
  },
  map: (doc: unknown) => T
): Paginated<T> {
  return {
    items: result.docs.map((doc) => map(doc)),
    page: result.page ?? page,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
  };
}

// The fields toJobListItem reads. The board pool loads up to 1000 jobs, so
// leaving out the description, summary and the rest of the company keeps
// each read (and Postgres network transfer) small.
const JOB_LIST_SELECT = {
  applyEmail: true,
  applyUrl: true,
  careerLevel: true,
  categories: true,
  company: true,
  companyLogo: true,
  companyName: true,
  companySlug: true,
  countryCode: true,
  employmentType: true,
  featured: true,
  languages: true,
  locationDisplay: true,
  origin: true,
  publishedAt: true,
  remoteRegion: true,
  salaryCurrency: true,
  salaryMax: true,
  salaryMaxUsd: true,
  salaryMin: true,
  salaryMinUsd: true,
  seniority: true,
  slug: true,
  title: true,
  validThrough: true,
  visaSponsorship: true,
  workplaceType: true,
} as const;

const JOB_LIST_POPULATE = {
  companies: { logoUrl: true },
  media: { filename: true, url: true, variants: true },
} as const;

export async function queryPublishedJobs(
  payload: Payload,
  input: { page: number; limit: number }
): Promise<Paginated<JobListItem>> {
  const result = await payload.find({
    collection: "jobs",
    depth: 1,
    draft: false,
    limit: input.limit,
    overrideAccess: false,
    page: input.page,
    populate: JOB_LIST_POPULATE,
    select: JOB_LIST_SELECT,
    sort: ["-publishedAt", "-id"],
  });

  return paginate(input.page, result, toJobListItem);
}

export interface JobTextEntry {
  id: string;
  // Summary and skills, lowercased, one per line.
  text: string;
}

// Summary and skills of published jobs, for board search. Cards leave both
// out (the saved page ships every card to the browser), so search matches
// q against this index on the server. It is read once per cache period
// rather than once per search string, so search traffic does not reach
// Postgres.
export async function queryJobTextIndex(
  payload: Payload,
  input: { limit: number }
): Promise<JobTextEntry[]> {
  const result = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: false,
    limit: input.limit,
    overrideAccess: false,
    pagination: false,
    select: { skills: true, summary: true },
    sort: ["-publishedAt", "-id"],
  });

  return result.docs.map((doc) => {
    const parts = [
      doc.summary ?? "",
      ...(doc.skills ?? []).map((skill) => skill.value ?? ""),
    ];
    return {
      id: String(doc.id),
      text: parts
        .filter((part) => part.length > 0)
        .join("\n")
        .toLowerCase(),
    };
  });
}

export async function queryJobBySlug(
  payload: Payload,
  slug: string
): Promise<JobDetail | null> {
  const result = await payload.find({
    collection: "jobs",
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  });
  const [doc] = result.docs;

  return doc ? toJobDetail(doc) : null;
}

export async function queryCompanies(
  payload: Payload,
  input: { page: number; limit: number }
): Promise<Paginated<CompanySummary>> {
  const result = await payload.find({
    collection: "companies",
    depth: 1,
    draft: false,
    limit: input.limit,
    overrideAccess: false,
    page: input.page,
  });

  return paginate(input.page, result, toCompanySummary);
}

export async function queryCompanyBySlug(
  payload: Payload,
  slug: string
): Promise<CompanyDetail | null> {
  const result = await payload.find({
    collection: "companies",
    depth: 1,
    draft: false,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  });
  const [doc] = result.docs;

  return doc ? toCompanyDetail(doc) : null;
}

export async function querySiteSettings(
  payload: Payload
): Promise<SiteSettingsView> {
  const doc = await payload.findGlobal({
    depth: 1,
    overrideAccess: false,
    slug: "site-settings",
  });

  return toSiteSettingsView(doc);
}

export async function queryBordfeedConnectionPublic(
  payload: Payload
): Promise<BordfeedConnectionPublic> {
  const doc = await payload.findGlobal({
    depth: 0,
    overrideAccess: false,
    slug: "bordfeed-connection",
  });

  return toBordfeedConnectionPublic(doc);
}
