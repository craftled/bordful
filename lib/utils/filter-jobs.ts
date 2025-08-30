import type { Job } from '@/lib/db/airtable';

export function filterJobsBySearch(jobs: Job[], searchTerm: string): Job[] {
  if (!searchTerm) {
    return jobs;
  }

  const searchLower = searchTerm.toLowerCase();

  return jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchLower) ||
      job.company.toLowerCase().includes(searchLower) ||
      (job.workplace_city?.toLowerCase() || '').includes(searchLower) ||
      (job.workplace_country?.toLowerCase() || '').includes(searchLower)
  );
}
