import Link from "next/link";
import type { ReactNode } from "react";

import { RelativeTime } from "@/components/board/relative-time";
import { customSlots } from "@/custom";
import {
  formatLocation,
  formatRelativePosted,
  formatSalary,
  isNewJob,
} from "@/lib/board/format";
import { buildJobPath } from "@/lib/board/paths";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_WORKPLACE_LABELS,
} from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

// The whole card is the link (stretched link), so nothing inside may be
// interactive. The focus ring sits on the card, not on the title text.
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

  const meta: { key: string; node: ReactNode }[] = [];
  if (job.employmentType) {
    meta.push({ key: "type", node: JOB_EMPLOYMENT_LABELS[job.employmentType] });
  }
  if (showWorkplace) {
    meta.push({ key: "workplace", node: workplace });
  }
  if (location) {
    meta.push({ key: "location", node: location });
  }
  if (salary) {
    meta.push({ key: "salary", node: salary });
  }
  if (job.publishedAt && posted) {
    meta.push({
      key: "posted",
      node: <RelativeTime iso={job.publishedAt} label={posted} />,
    });
  }
  if (job.publishedAt && isNewJob(job.publishedAt, now)) {
    meta.push({ key: "new", node: "New" });
  }

  return (
    <li data-job-slug={job.slug} data-origin={job.origin} data-testid="job-row">
      <article className="relative rounded-lg border bg-card p-4 transition-colors hover:border-zinc-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 className="line-clamp-2 font-medium text-base">
              <Link
                className="rounded-sm outline-none after:absolute after:inset-0"
                data-testid="job-row-link"
                href={buildJobPath(job.slug)}
              >
                {job.title}
              </Link>
            </h2>
            <p className="text-muted-foreground text-sm">{job.companyName}</p>
          </div>
          <div className="flex items-center gap-2">
            {job.featured ? (
              <span className="rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground text-xs">
                Featured
              </span>
            ) : null}
            {Extra ? <Extra /> : null}
          </div>
        </div>
        {meta.length > 0 ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
            {meta.map((item, index) => (
              <span className="inline-flex items-center gap-2" key={item.key}>
                {index > 0 ? <span aria-hidden="true">&bull;</span> : null}
                {item.node}
              </span>
            ))}
          </p>
        ) : null}
      </article>
    </li>
  );
}
