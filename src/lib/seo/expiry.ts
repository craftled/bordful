// The feed and sitemap lists are cached for up to 300s and only revalidated
// when a job is written. A job that simply passes validThrough triggers no
// write, so it is dropped again at read time, matching publishedAndUnexpiredWhere.
export function dropExpired<T extends { validThrough: string | null }>(
  jobs: T[],
  now: Date
): T[] {
  const cutoff = now.getTime();
  return jobs.filter(
    (job) => job.validThrough === null || Date.parse(job.validThrough) > cutoff
  );
}
