import { resolveServerUrl } from "@/config/server-url";
import { getSiteSettings } from "@/lib/read";
import type { SiteSettingsView } from "@/lib/read/types";
import { getFeedJobs } from "@/lib/seo/queries";
import { buildRssFeed } from "@/lib/seo/rss";

function channelDescription(settings: SiteSettingsView): string {
  return settings.board.description || settings.tagline || settings.name;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, jobs] = await Promise.all([
    getSiteSettings(),
    getFeedJobs(),
  ]);
  const siteUrl = resolveServerUrl();
  const body = buildRssFeed({
    jobs,
    siteDescription: channelDescription(settings),
    siteName: settings.name,
    siteUrl,
  });

  return new Response(body, {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "application/rss+xml; charset=utf-8",
    },
  });
}
