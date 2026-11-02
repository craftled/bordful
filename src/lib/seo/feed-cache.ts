// Feeds are already cached server side by getFeedJobs (unstable_cache, 300s,
// tagged and revalidated when a job is written). A shared-cache lifetime here
// would let the Vercel CDN keep serving an expired or unpublished job for
// minutes after that tag is revalidated, so the CDN and browsers must
// revalidate on every request. A job that only passes validThrough, with no
// write, is still bounded by the 300s server-side window.
export const FEED_CACHE_CONTROL = "public, max-age=0, must-revalidate";
