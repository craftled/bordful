import { Fragment, type ReactNode } from "react";

import { JobRow, type JobRowVariant } from "@/components/board/job-row";
import type { JobListItem } from "@/lib/read/types";

// The optional insert (the phone alert card) sits after this many rows, or
// after the last row when the page is shorter.
const INSERT_AFTER = 3;

export function BoardList({
  insert,
  jobs,
  now,
  variant,
}: {
  insert?: ReactNode;
  jobs: JobListItem[];
  now: number;
  variant?: JobRowVariant;
}) {
  const insertAt = Math.min(INSERT_AFTER, jobs.length) - 1;

  return (
    <ul className="flex flex-col gap-0.5" data-testid="job-list">
      {jobs.map((job, index) => (
        <Fragment key={job.id}>
          <JobRow job={job} now={now} variant={variant} />
          {insert && index === insertAt ? insert : null}
        </Fragment>
      ))}
    </ul>
  );
}

export function jobCountLabel(count: number): string {
  return count === 1 ? "1 job" : `${count} jobs`;
}
