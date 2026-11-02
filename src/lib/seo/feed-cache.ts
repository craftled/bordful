// Feeds are already cached server side by getFeedJobs (unstable_cache, tagged and
// revalidated when jobs change). A shared-cache lifetime here would let the Vercel
// CDN keep serving an expired or unpublished job for minutes after that tag is
// revalidated, so the CDN and browsers must revalidate on every request.
export const FEED_CACHE_CONTROL = "public, max-age=0, must-revalidate";
