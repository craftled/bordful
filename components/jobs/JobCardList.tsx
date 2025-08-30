'use client';

import { JobCard } from '@/components/jobs/JobCard';
import type { Job } from '@/lib/db/airtable';

export function JobCardList({ jobs }: { jobs: Job[] }) {
  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard job={job} key={job.id} />
      ))}
    </div>
  );
}
