import type { MetadataRoute } from "next";

import { TAXONOMY_INDEX_PATH } from "@/components/board/taxonomy-tabs";
import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import { getSiteSettings } from "@/lib/read";
import { getSitemapJobs } from "@/lib/seo/queries";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

const TAXONOMY_INDEX_PATHS = Object.values(TAXONOMY_INDEX_PATH);

// A static build must not open the database. Entries are built per request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveServerUrl();
  const [jobs, settings] = await Promise.all([
    getSitemapJobs(),
    getSiteSettings(),
  ]);
  const entries = buildSitemapEntries({
    alerts: settings.alerts.enabled,
    jobs,
    marketing: isMarketingEnabled(),
    postJob: settings.postJob.enabled,
    siteUrl,
  });
  const known = new Set(entries.map((entry) => entry.url));
  const indexes = TAXONOMY_INDEX_PATHS.map((path) => `${siteUrl}${path}`)
    .filter((url) => !known.has(url))
    .map((url) => ({ url }));
  // The taxonomy indexes sit with the other section pages, ahead of the jobs.
  const sections = entries.findIndex((entry) => entry.url.includes("/jobs/"));
  const at = sections === -1 ? entries.length : sections;

  return [...entries.slice(0, at), ...indexes, ...entries.slice(at)];
}
