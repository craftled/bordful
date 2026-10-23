import Link from "next/link";

import { RelativeTime } from "@/components/board/relative-time";
import { customSlots } from "@/custom";
import {
  formatLocation,
  formatRelativePosted,
  formatSalary,
  isNewJob,
} from "@/lib/board/format";
import { buildCompanyPath, buildJobPath } from "@/lib/board/paths";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_WORKPLACE_LABELS,
} from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

export function JobRow({ job, now }: { job: JobListItem; now: number }) {
  const Extra = customSlots["job-card-extra"];
  const salary = formatSalary(job);
  const location = formatLocation(job);
  const workplace = job.workplaceType
    ? JOB_WORKPLACE_LABELS[job.workplaceType]
    : null;
  const showWorkplace =
    workplace !== null &&
    location !== workplace &&
    !location.startsWith(`${workplace} `) &&
    !location.startsWith(`${workplace},`);
  const posted = job.publishedAt
    ? formatRelativePosted(job.publishedAt, now)
    : "";

  return (
    <li
      className="py-4"
      data-job-slug={job.slug}
      data-origin={job.origin}
      data-testid="job-row"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {job.companySlug ? (
            <Link
              className="text-muted-foreground text-sm"
              href={buildCompanyPath(job.companySlug)}
            >
              {job.companyName}
            </Link>
          ) : (
            <p className="text-muted-foreground text-sm">{job.companyName}</p>
          )}
          <h2 className="font-semibold text-xl">
            <Link data-testid="job-row-link" href={buildJobPath(job.slug)}>
              {job.title}
            </Link>
          </h2>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-sm">
            {job.employmentType ? (
              <span>{JOB_EMPLOYMENT_LABELS[job.employmentType]}</span>
            ) : null}
            {showWorkplace ? <span>{workplace}</span> : null}
            <span>{location}</span>
            {salary ? <span>{salary}</span> : null}
            {job.publishedAt && posted ? (
              <RelativeTime iso={job.publishedAt} label={posted} />
            ) : null}
            {job.publishedAt && isNewJob(job.publishedAt, now) ? (
              <span>New</span>
            ) : null}
          </p>
        </div>
        {Extra ? <Extra /> : null}
      </div>
    </li>
  );
}
