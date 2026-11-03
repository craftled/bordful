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
import { cn } from "@/lib/utils";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const SHORT_WEEKS = 5;
// A listing whose closing date falls within this window reads as "Closing".
const CLOSING_MS = 7 * MS_PER_DAY;

// The short age the list shows ("2h", "3d", "4w"). Older posts fall back to a
// short date. Empty for an unparseable date so callers can omit it.
export function compactRelative(iso: string, now: number): string {
  const posted = Date.parse(iso);
  if (Number.isNaN(posted)) {
    return "";
  }

  const age = Math.max(0, now - posted);
  if (age < MS_PER_HOUR) {
    return `${Math.max(1, Math.floor(age / MS_PER_MINUTE))}m`;
  }
  if (age < MS_PER_DAY) {
    return `${Math.floor(age / MS_PER_HOUR)}h`;
  }
  if (age < MS_PER_WEEK) {
    return `${Math.floor(age / MS_PER_DAY)}d`;
  }
  if (age < SHORT_WEEKS * MS_PER_WEEK) {
    return `${Math.floor(age / MS_PER_WEEK)}w`;
  }

  return new Date(posted).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function isClosingSoon(validThrough: string | null, now: number) {
  if (validThrough === null) {
    return false;
  }
  const closes = Date.parse(validThrough);
  if (Number.isNaN(closes)) {
    return false;
  }

  const left = closes - now;
  return left >= 0 && left <= CLOSING_MS;
}

type JobStatus = "closing" | "featured" | "new";

const STATUS_LABEL: Record<JobStatus, string> = {
  closing: "Closing",
  featured: "Featured",
  new: "New",
};

const STATUS_CLASS: Record<JobStatus, string> = {
  closing: "bg-closing/10 text-closing",
  featured: "bg-featured/10 text-featured",
  new: "bg-new/10 text-new",
};

export function jobStatuses(job: JobListItem, now: number): JobStatus[] {
  const statuses: JobStatus[] = [];
  if (job.featured) {
    statuses.push("featured");
  }
  if (isClosingSoon(job.validThrough, now)) {
    statuses.push("closing");
  } else if (job.publishedAt && isNewJob(job.publishedAt, now)) {
    statuses.push("new");
  }
  return statuses;
}

export function StatusPill({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-[6px] px-1.5 text-[11px] leading-4 font-medium",
        STATUS_CLASS[status]
      )}
      data-status={status}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function CompanyLogo({ job }: { job: JobListItem }) {
  const initial = job.companyName.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      className="bg-tag text-muted-foreground flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[9px] text-[14px] font-medium [grid-area:logo] lg:size-7 lg:rounded-[7px] lg:text-[12px]"
    >
      {job.companyLogoUrl ? (
        // biome-ignore lint/performance/noImgElement: a 28px company mark, served as-is
        <img
          alt=""
          className="size-full object-cover"
          height={36}
          loading="lazy"
          src={job.companyLogoUrl}
          width={36}
        />
      ) : (
        initial
      )}
    </span>
  );
}

// One DOM tree, two grids. Phone: title and age on top, company line, then
// salary with the status pill. Desktop: title with the pill, company line
// below, salary and age stacked on the right.
const ROW_GRID =
  "grid grid-cols-[2.25rem_minmax(0,max-content)_minmax(0,1fr)_auto] gap-x-3 [grid-template-areas:'logo_title_title_time'_'logo_meta_meta_meta'_'logo_salary_badges_badges'] lg:h-[60px] lg:grid-cols-[1.75rem_minmax(0,max-content)_minmax(0,1fr)_auto] lg:items-center lg:gap-x-1.5 lg:[grid-template-areas:'logo_title_badges_salary'_'logo_meta_meta_time']";

// The title link stretches over the whole row. Other links and slot content
// sit above it (z-10) so they stay clickable; the focus ring sits on the row.
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
  const age = job.publishedAt ? compactRelative(job.publishedAt, now) : "";
  const posted = job.publishedAt
    ? formatRelativePosted(job.publishedAt, now)
    : "";
  const statuses = jobStatuses(job, now);

  const details: { key: string; label: string }[] = [];
  if (location) {
    details.push({ key: "location", label: location });
  }
  if (showWorkplace && workplace) {
    details.push({ key: "workplace", label: workplace });
  }
  if (job.employmentType) {
    details.push({
      key: "type",
      label: JOB_EMPLOYMENT_LABELS[job.employmentType],
    });
  }

  return (
    <li data-job-slug={job.slug} data-origin={job.origin} data-testid="job-row">
      <article
        className={cn(
          ROW_GRID,
          "has-[:focus-visible]:ring-ring hover:bg-card hover:ring-line active:bg-card relative rounded-lg px-2.5 py-3 transition-colors hover:ring-1 has-[:focus-visible]:ring-2 lg:rounded-[10px] lg:px-3 lg:py-0"
        )}
      >
        <CompanyLogo job={job} />
        <h3 className="text-foreground min-w-0 truncate text-[15px] leading-5 font-normal [grid-area:title] lg:self-end lg:text-[14px]">
          <Link
            className="rounded-sm outline-none after:absolute after:inset-0"
            data-testid="job-row-link"
            href={buildJobPath(job.slug)}
          >
            {job.title}
          </Link>
        </h3>
        {statuses.length > 0 || Extra ? (
          <div className="mt-1 flex min-w-0 items-center gap-1.5 [grid-area:badges] lg:mt-0 lg:self-end lg:pb-0.5">
            {statuses.map((status) => (
              <StatusPill key={status} status={status} />
            ))}
            {Extra ? (
              <div className="relative z-10">
                <Extra />
              </div>
            ) : null}
          </div>
        ) : null}
        <p className="text-muted-foreground lg:text-subtle mt-0.5 flex min-w-0 flex-wrap items-center text-[13px] leading-[18px] [grid-area:meta] lg:mt-0 lg:self-start lg:text-[12px] lg:leading-4">
          {job.companySlug ? (
            <Link
              className="relative z-10 rounded-sm hover:underline"
              href={buildCompanyPath(job.companySlug)}
            >
              {job.companyName}
            </Link>
          ) : (
            <span>{job.companyName}</span>
          )}
          {details.map((item) => (
            <span className="min-w-0" key={item.key}>
              <span aria-hidden="true" className="px-1">
                &middot;
              </span>
              <span>{item.label}</span>
            </span>
          ))}
        </p>
        {salary ? (
          <p className="text-foreground lg:text-muted-foreground mt-1 truncate text-[13px] leading-[18px] font-medium [grid-area:salary] lg:mt-0 lg:self-end lg:text-right lg:font-normal">
            {salary}
          </p>
        ) : null}
        {job.publishedAt && age ? (
          <RelativeTime
            className="text-subtle text-right text-[12px] leading-5 [grid-area:time] lg:self-start lg:leading-4"
            iso={job.publishedAt}
            label={age}
            title={posted}
          />
        ) : null}
      </article>
    </li>
  );
}
