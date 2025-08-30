'use client';

import { CompactJobCard } from '@/components/jobs/CompactJobCard';
import type { Job } from '@/lib/db/airtable';

export function CompactJobCardList({
  jobs,
  className = '',
}: {
  jobs: Job[];
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-md border ${className}`}>
      {jobs.map((job, index) => (
        <div className={index !== 0 ? 'border-t' : ''} key={job.id}>
          <CompactJobCard job={job} />
        </div>
      ))}
    </div>
  );
}
