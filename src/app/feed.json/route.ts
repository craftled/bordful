import { resolveServerUrl } from "@/config/server-url";
import { getSiteSettings } from "@/lib/read";
import { buildJsonFeed } from "@/lib/seo/json-feed";
import { getFeedJobs } from "@/lib/seo/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [settings, jobs] = await Promise.all([
    getSiteSettings(),
    getFeedJobs(),
  ]);
  const body = buildJsonFeed({
    jobs,
    siteName: settings.name,
    siteUrl: resolveServerUrl(),
  });

  return new Response(JSON.stringify(body), {
    headers: {
      "cache-control": "public, max-age=300",
      "content-type": "application/feed+json; charset=utf-8",
    },
  });
}
