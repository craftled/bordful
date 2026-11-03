import Link from "next/link";

import { RelativeTime } from "@/components/board/relative-time";
import {
  formatLocation,
  formatRelativePosted,
  formatSalary,
  isNewJob,
} from "@/lib/board/format";
import { buildJobPath } from "@/lib/board/paths";
import type { JobListItem } from "@/lib/read/types";

const LOCATION_FALLBACK = "Location not listed";

const AGE_RE = /^(?<count>\d+) (?<unit>minute|hour|day)s? ago$/u;
const AGE_UNITS: Record<string, string> = { day: "d", hour: "h", minute: "m" };

// "3 days ago" -> "3d" to fit the card corner; older dates stay as they are.
function shortAge(label: string): string {
  const groups = AGE_RE.exec(label)?.groups;
  if (!(groups?.count && groups.unit)) {
    return label === "just now" ? "now" : label;
  }
  return `${groups.count}${AGE_UNITS[groups.unit] ?? ""}`;
}

function SimilarJob({ job, now }: { job: JobListItem; now: number }) {
  const location = formatLocation(job);
  const salary = formatSalary(job);
  const posted = job.publishedAt
    ? formatRelativePosted(job.publishedAt, now)
    : "";
  const isNew = job.publishedAt ? isNewJob(job.publishedAt, now) : false;
  const subtitle = [
    job.companyName,
    location === LOCATION_FALLBACK ? "" : location,
  ]
    .filter((part) => part.length > 0)
    .join(" · ");

  return (
    <li className="has-[:focus-visible]:ring-ring sm:bg-card sm:ring-line hover:bg-selected relative flex gap-3 p-3.5 transition-colors has-[:focus-visible]:ring-2 sm:flex-col sm:rounded-[14px] sm:p-[18px] sm:ring-1 sm:ring-inset">
      <span
        aria-hidden="true"
        className="bg-logo-tile text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg text-[13px] leading-4 font-semibold sm:size-8"
      >
        {job.companyName.trim().charAt(0).toUpperCase()}
      </span>
      {job.publishedAt && posted ? (
        <span className="text-subtle absolute top-3.5 right-3.5 text-[12px] leading-4 sm:top-[26px] sm:right-[18px]">
          <RelativeTime iso={job.publishedAt} label={shortAge(posted)} />
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-[3px] sm:gap-3">
        <div className="flex min-w-0 flex-col gap-[3px] sm:gap-0.5">
          <h3 className="text-foreground pr-8 text-[15px] leading-[18px] font-medium sm:pr-0 sm:leading-5">
            <Link
              className="rounded-sm outline-none after:absolute after:inset-0"
              href={buildJobPath(job.slug)}
            >
              {job.title}
            </Link>
          </h3>
          {subtitle ? (
            <p className="text-muted-foreground truncate text-[13px] leading-4 sm:leading-[18px]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {salary || job.featured || isNew ? (
          <p className="flex flex-wrap items-center gap-1.5 text-[13px] leading-4 sm:leading-[18px]">
            {salary ? (
              <span className="text-foreground font-medium">{salary}</span>
            ) : null}
            {job.featured ? (
              <span className="bg-featured/10 text-featured rounded-md px-1.5 text-[11px] leading-4 font-medium">
                Featured
              </span>
            ) : null}
            {!job.featured && isNew ? (
              <span className="bg-new/10 text-new rounded-md px-1.5 text-[11px] leading-4 font-medium">
                New
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function SimilarJobs({
  companyHref,
  companyName,
  jobs,
  now,
  openRoles,
}: {
  companyHref: string | null;
  companyName: string;
  jobs: readonly JobListItem[];
  now: number;
  openRoles: number;
}) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="similar-jobs-title"
      className="flex flex-col gap-2.5 sm:gap-5"
      data-testid="similar-jobs"
    >
      <div className="flex items-end justify-between gap-4">
        <h2
          className="text-subtle sm:text-foreground font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase sm:font-sans sm:text-[22px] sm:leading-7 sm:tracking-[-0.015em] sm:normal-case"
          id="similar-jobs-title"
        >
          Similar jobs
        </h2>
        {companyHref && openRoles > 1 ? (
          <Link
            className="text-foreground shrink-0 text-[13px] leading-[18px] font-medium hover:underline"
            href={companyHref}
          >
            See all {openRoles} {companyName} jobs
            <span aria-hidden="true"> →</span>
          </Link>
        ) : null}
      </div>
      <ul className="bg-card ring-line divide-line overflow-clip rounded-[14px] ring-1 max-sm:divide-y sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:rounded-none sm:bg-transparent sm:ring-0 lg:grid-cols-3">
        {jobs.map((job) => (
          <SimilarJob job={job} key={job.id} now={now} />
        ))}
      </ul>
    </section>
  );
}
