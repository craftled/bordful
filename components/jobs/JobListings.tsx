import { JobCard } from '@/components/jobs/JobCard';
import type { Job } from '@/lib/db/airtable';

type JobListingsProps = {
  jobs: Job[];
  showFiltered?: boolean;
};

export function JobListings({ jobs, showFiltered = true }: JobListingsProps) {
  return (
    <div className="space-y-4">
      {showFiltered && (
        <p className="text-gray-500 text-sm">
          Showing {jobs.length.toLocaleString()}{' '}
          {jobs.length === 1 ? 'position' : 'positions'}
        </p>
      )}
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard job={job} key={job.id} />
        ))}
      </div>
    </div>
  );
}
