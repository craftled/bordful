import Link from "next/link";

import { buildJobPath } from "@/lib/board/paths";
import type { JobListItem } from "@/lib/read/types";

export function SimilarJobs({ jobs }: { jobs: readonly JobListItem[] }) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="similar-jobs-title" className="space-y-3">
      <h2 className="text-base font-semibold" id="similar-jobs-title">
        Similar jobs
      </h2>
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link
              className="text-sm font-medium hover:underline"
              href={buildJobPath(job.slug)}
            >
              {job.title}
            </Link>
            <p className="text-muted-foreground text-xs">
              {job.companyName}
              {job.locationDisplay ? ` · ${job.locationDisplay}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
