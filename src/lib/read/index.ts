import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import {
  queryBordfeedConnectionPublic,
  queryCompanies,
  queryCompanyBySlug,
  queryJobBySlug,
  queryJobIdsMatchingText,
  queryPublishedJobs,
  querySiteSettings,
} from "./queries";
import { revalidateReadTags } from "./revalidate";
import { companyTag, jobTag, READ_TAGS } from "./tags";

// `next build` renders with the build machine's database. Caching that result
// would serve it to real requests for five minutes after the deploy starts.
function cachedRead<T>(
  load: () => Promise<T>,
  keyParts: string[],
  tags: string[]
): Promise<T> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return load();
  }

  return unstable_cache(load, keyParts, { revalidate: 300, tags })();
}

export async function listPublishedJobs(input: {
  page: number;
  limit: number;
}) {
  const load = async () => {
    const payload = await getPayload({ config });
    return queryPublishedJobs(payload, input);
  };
  const cached = await cachedRead(
    load,
    ["listPublishedJobs", String(input.page), String(input.limit)],
    [READ_TAGS.jobs]
  );
  if (cached.items.length > 0 || input.page !== 1) {
    return cached;
  }

  // A fresh deploy renders its first pages while the sample jobs are still
  // being seeded, and a tag revalidated during that render does not evict
  // the entry the render then writes. An empty first page is rare and cheap
  // to read again, so check the database before serving an empty board.
  const fresh = await load();
  if (fresh.items.length > 0) {
    revalidateReadTags([READ_TAGS.jobs]);
  }

  return fresh;
}

export function searchJobIdsByText(input: { limit: number; q: string }) {
  const q = input.q.trim().toLowerCase();
  return cachedRead(
    async () => {
      const payload = await getPayload({ config });
      return queryJobIdsMatchingText(payload, { limit: input.limit, q });
    },
    ["searchJobIdsByText", q, String(input.limit)],
    [READ_TAGS.jobs]
  );
}

export function getJobBySlug(slug: string) {
  return cachedRead(
    async () => {
      const payload = await getPayload({ config });
      return queryJobBySlug(payload, slug);
    },
    ["getJobBySlug", slug],
    [READ_TAGS.jobs, jobTag(slug)]
  );
}

export function listCompanies(input: { page: number; limit: number }) {
  return cachedRead(
    async () => {
      const payload = await getPayload({ config });
      return queryCompanies(payload, input);
    },
    ["listCompanies", String(input.page), String(input.limit)],
    [READ_TAGS.companies]
  );
}

export function getCompanyBySlug(slug: string) {
  return cachedRead(
    async () => {
      const payload = await getPayload({ config });
      return queryCompanyBySlug(payload, slug);
    },
    ["getCompanyBySlug", slug],
    [READ_TAGS.companies, companyTag(slug)]
  );
}

export function getSiteSettings() {
  return cachedRead(
    async () => {
      const payload = await getPayload({ config });
      return querySiteSettings(payload);
    },
    ["getSiteSettings"],
    [READ_TAGS.siteSettings]
  );
}

export function getBordfeedConnectionPublic() {
  return cachedRead(
    async () => {
      const payload = await getPayload({ config });
      return queryBordfeedConnectionPublic(payload);
    },
    ["getBordfeedConnectionPublic"],
    [READ_TAGS.bordfeedConnection]
  );
}
