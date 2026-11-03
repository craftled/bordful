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
    sort: ["-publishedAt", "-id"],
  });

  return paginate(input.page, result, toJobListItem);
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
