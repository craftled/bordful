import type { MetadataRoute } from "next";

import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import { getSitemapJobs } from "@/lib/seo/queries";
import { buildSitemapEntries } from "@/lib/seo/sitemap";

// A static build must not open the database. Entries are built per request.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries({
    jobs: await getSitemapJobs(),
    marketing: isMarketingEnabled(),
    siteUrl: resolveServerUrl(),
  });
}
