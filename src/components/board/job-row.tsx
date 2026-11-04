import Link from "next/link";

import { RowSaveButton } from "@/components/board/job-row-save";
import { HINT_CLASS } from "@/components/board/rail-styles";
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
        "inline-flex shrink-0 items-center rounded-[8px] px-1.5 text-[11px] leading-4 font-medium",
        STATUS_CLASS[status]
      )}
      data-status={status}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function CompanyLogo({
  job,
  variant,
}: {
  job: JobListItem;
  variant: JobRowVariant;
}) {
  const initial = job.companyName.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-tag text-muted-foreground lg:group-data-[selected=true]/row:bg-foreground lg:group-data-[selected=true]/row:text-background flex shrink-0 items-center justify-center overflow-hidden [grid-area:logo]",
        variant === "archive"
          ? "size-10 rounded-[8px] text-[13px] leading-4 font-semibold lg:size-9"
          : "size-9 rounded-[9px] text-[14px] font-medium lg:size-7 lg:rounded-[7px] lg:text-[12px]"
      )}
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

// "board" is the dense list beside the preview pane; "archive" is the roomier
// row inside a taxonomy archive's bordered card (Paper's level, type,
// location and language detail artboards).
export type JobRowVariant = "archive" | "board";

// One DOM tree, two grids. Phone: title and age on top, company line, then
// salary with the status pill. Desktop: title with the pill, company line
// below, the hover hints, then salary and age stacked on the right.
const ROW_GRID =
  "grid grid-cols-[2.25rem_minmax(0,max-content)_minmax(0,1fr)_auto] gap-x-3 [grid-template-areas:'logo_title_title_time'_'logo_meta_meta_meta'_'logo_salary_badges_badges'] lg:h-[60px] lg:grid-cols-[2.125rem_minmax(0,max-content)_minmax(0,1fr)_auto_auto] lg:content-center lg:items-center lg:gap-x-1.5 lg:gap-y-0.5 lg:[grid-template-areas:'logo_title_badges_hints_salary'_'logo_meta_meta_hints_time']";

// Paper's archive rows: a 40px mark on phones (14px padding all round, lines
// 3px apart), a 36px mark in a 72px row from lg up, 12px between the columns.
const ARCHIVE_GRID =
  "grid grid-cols-[2.5rem_minmax(0,max-content)_minmax(0,1fr)_auto] gap-x-3 [grid-template-areas:'logo_title_title_time'_'logo_meta_meta_meta'_'logo_salary_badges_badges'] lg:h-[72px] lg:grid-cols-[2.25rem_minmax(0,max-content)_minmax(0,1fr)_auto_auto] lg:content-center lg:items-center lg:gap-y-0.5 lg:[grid-template-areas:'logo_title_badges_hints_salary'_'logo_meta_meta_hints_time']";

// The board's preview script marks the open row with data-selected.
const ROW_SELECTED =
  "group-data-[selected=true]/row:bg-card group-data-[selected=true]/row:ring-line group-data-[selected=true]/row:ring-1 group-data-[selected=true]/row:shadow-xs lg:group-data-[selected=true]/row:before:bg-foreground lg:before:absolute lg:before:top-[18px] lg:before:-left-2 lg:before:h-6 lg:before:w-[3px] lg:before:rounded-r-[3px]";

// The per-variant pieces of the row; the shared classes stay inline below.
const ROW_STYLES: Record<
  JobRowVariant,
  {
    article: string;
    badges: string;
    meta: string;
    salary: string;
    time: string;
    title: string;
  }
> = {
  archive: {
    article: cn(
      ARCHIVE_GRID,
      "hover:bg-surface-sub active:bg-surface-sub p-3.5 lg:px-4 lg:py-0"
    ),
    // Paper's phone pill line is 17px (an inline-block pill); from lg up the
    // pill sits 8px after the title, centred on its 22px line.
    badges: "mt-[3px] max-lg:min-h-[17px] lg:-ml-1 lg:pb-[3px]",
    meta: "mt-[3px] leading-4 lg:leading-[19px]",
    salary: "mt-[3px] leading-4 lg:leading-[19px]",
    time: "leading-4 lg:leading-[17px]",
    title: "leading-[18px] font-medium lg:leading-[22px]",
  },
  board: {
    article: cn(
      ROW_GRID,
      "hover:bg-card hover:ring-line active:bg-card rounded-[12px] px-2.5 py-3 hover:ring-1 lg:rounded-[10px] lg:px-3 lg:py-0"
    ),
    badges: "mt-1 lg:ml-0 lg:pb-0.5",
    meta: "lg:text-subtle mt-0.5 leading-[18px] lg:text-[12px] lg:leading-4",
    salary:
      "lg:text-muted-foreground lg:group-hover/row:text-foreground lg:group-data-[selected=true]/row:text-foreground mt-1 leading-[18px] lg:font-normal",
    time: "leading-5 lg:leading-4",
    title:
      "leading-5 font-normal lg:text-[14px] lg:group-data-[selected=true]/row:font-medium",
  },
};

// The title link stretches over the whole row. Other links and slot content
// sit above it (z-10) so they stay clickable; the focus ring sits on the row.
export function JobRow({
  job,
  now,
  variant = "board",
}: {
  job: JobListItem;
  now: number;
  variant?: JobRowVariant;
}) {
  const styles = ROW_STYLES[variant];
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
    <li
      className="group/row"
      data-job-slug={job.slug}
      data-origin={job.origin}
      data-testid="job-row"
    >
      <article
        className={cn(
          ROW_SELECTED,
          "has-[:focus-visible]:ring-ring relative transition-colors has-[:focus-visible]:ring-2",
          styles.article
        )}
      >
        <CompanyLogo job={job} variant={variant} />
        <h2
          className={cn(
            "text-foreground min-w-0 truncate text-[15px] [grid-area:title] lg:self-end",
            styles.title
          )}
        >
          <Link
            className="rounded-sm outline-none after:absolute after:inset-0"
            data-testid="job-row-link"
            href={buildJobPath(job.slug)}
          >
            {job.title}
          </Link>
        </h2>
        {statuses.length > 0 || Extra ? (
          <div
            className={cn(
              "flex min-w-0 items-center gap-1.5 [grid-area:badges] lg:mt-0 lg:self-end",
              styles.badges,
              // Phone: 6px after the salary, or flush left without one.
              salary ? "max-lg:-ml-1.5" : "max-lg:-ml-3"
            )}
          >
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
        <p
          className={cn(
            "text-muted-foreground min-w-0 truncate text-[13px] [grid-area:meta] lg:mt-0 lg:self-start",
            styles.meta
          )}
        >
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
        <div className="hidden items-center gap-1.5 pr-3.5 pl-1.5 [grid-area:hints] lg:group-focus-within/row:flex lg:group-hover/row:flex lg:group-data-[selected=true]/row:hidden!">
          <RowSaveButton slug={job.slug} title={job.title} />
          <span aria-hidden="true" className={HINT_CLASS}>
            <kbd className="font-sans">↵</kbd>
            Open
          </span>
        </div>
        {salary ? (
          <p
            className={cn(
              "text-foreground truncate text-[13px] font-medium [grid-area:salary] lg:mt-0 lg:self-end lg:text-right",
              styles.salary
            )}
          >
            {salary}
          </p>
        ) : null}
        {job.publishedAt && age ? (
          <RelativeTime
            className={cn(
              "text-subtle text-right text-[12px] [grid-area:time] lg:self-start",
              styles.time
            )}
            iso={job.publishedAt}
            label={age}
            title={posted}
          />
        ) : null}
      </article>
    </li>
  );
}
