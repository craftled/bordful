import { JobRow } from "@/components/board/job-row";
import type { JobListItem } from "@/lib/read/types";

export function BoardList({ jobs, now }: { jobs: JobListItem[]; now: number }) {
  return (
    <ul className="divide-y divide-border" data-testid="job-list">
      {jobs.map((job) => (
        <JobRow job={job} key={job.id} now={now} />
      ))}
    </ul>
  );
}

export function jobCountLabel(count: number): string {
  return count === 1 ? "1 job" : `${count} jobs`;
}
