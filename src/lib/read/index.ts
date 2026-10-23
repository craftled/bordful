import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import {
  queryBordfeedConnectionPublic,
  queryCompanies,
  queryCompanyBySlug,
  queryJobBySlug,
  queryPublishedJobs,
  querySiteSettings,
} from "./queries";
import { companyTag, jobTag, READ_TAGS } from "./tags";

export function listPublishedJobs(input: { page: number; limit: number }) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config });
      return queryPublishedJobs(payload, input);
    },
    ["listPublishedJobs", String(input.page), String(input.limit)],
    { revalidate: 300, tags: [READ_TAGS.jobs] }
  )();
}

export function getJobBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config });
      return queryJobBySlug(payload, slug);
    },
    ["getJobBySlug", slug],
    { revalidate: 300, tags: [READ_TAGS.jobs, jobTag(slug)] }
  )();
}

export function listCompanies(input: { page: number; limit: number }) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config });
      return queryCompanies(payload, input);
    },
    ["listCompanies", String(input.page), String(input.limit)],
    { revalidate: 300, tags: [READ_TAGS.companies] }
  )();
}

export function getCompanyBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config });
      return queryCompanyBySlug(payload, slug);
    },
    ["getCompanyBySlug", slug],
    { revalidate: 300, tags: [READ_TAGS.companies, companyTag(slug)] }
  )();
}

export function getSiteSettings() {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config });
      return querySiteSettings(payload);
    },
    ["getSiteSettings"],
    { revalidate: 300, tags: [READ_TAGS.siteSettings] }
  )();
}

export function getBordfeedConnectionPublic() {
  return unstable_cache(
    async () => {
      const payload = await getPayload({ config });
      return queryBordfeedConnectionPublic(payload);
    },
    ["getBordfeedConnectionPublic"],
    { revalidate: 300, tags: [READ_TAGS.bordfeedConnection] }
  )();
}
