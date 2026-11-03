import {
  compactRelative,
  jobStatuses,
  StatusPill,
} from "@/components/board/job-row";
import { formatLocation, formatSalary } from "@/lib/board/format";
import type { JobListItem } from "@/lib/read/types";

// How many current jobs the preview shows.
export const EXAMPLE_EMAIL_JOBS = 2;

// The digest's own subject line (emails/digest.ts).
function digestSubject(count: number, siteName: string): string {
  return count === 1
    ? `1 new job on ${siteName}`
    : `${count} new jobs on ${siteName}`;
}

function ExampleRow({ job, now }: { job: JobListItem; now: number }) {
  const initial = job.companyName.trim().charAt(0).toUpperCase() || "?";
  const location = formatLocation(job);
  const meta = location ? `${job.companyName} · ${location}` : job.companyName;
  const salary = formatSalary(job);
  const age = job.publishedAt ? compactRelative(job.publishedAt, now) : "";
  const statuses = jobStatuses(job, now);

  // Phone: title and age, then company, then salary with the status pills.
  // Desktop: title over company, salary over age on the right.
  return (
    <li className="border-line grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-3 gap-y-[3px] border-b p-[14px] [grid-template-areas:'logo_title_time'_'logo_meta_meta'_'logo_salary_salary'] last:border-b-0 md:grid-cols-[2.25rem_minmax(0,1fr)_auto] md:items-center md:gap-y-0.5 md:px-4 md:[grid-template-areas:'logo_title_salary'_'logo_meta_time']">
      <span
        aria-hidden="true"
        className="bg-tag text-muted-foreground flex size-10 items-center justify-center self-start rounded-[8px] text-[13px] leading-4 font-semibold [grid-area:logo] md:row-span-2 md:size-9 md:self-center"
      >
        {initial}
      </span>
      <span className="text-foreground truncate text-[15px] leading-[18px] font-medium [grid-area:title]">
        {job.title}
      </span>
      <span className="text-muted-foreground truncate text-[13px] leading-4 [grid-area:meta]">
        {meta}
      </span>
      {age ? (
        <span className="text-subtle justify-self-end text-[12px] leading-4 [grid-area:time]">
          {age}
        </span>
      ) : null}
      {salary || statuses.length > 0 ? (
        <span className="flex items-center gap-1.5 [grid-area:salary] md:justify-self-end">
          {salary ? (
            <span className="text-foreground text-[13px] leading-4 font-medium">
              {salary}
            </span>
          ) : null}
          {statuses.map((status) => (
            <span className="md:hidden" key={status}>
              <StatusPill status={status} />
            </span>
          ))}
        </span>
      ) : null}
    </li>
  );
}

// An illustration of the digest built from jobs on the board right now.
export function ExampleEmail({
  jobs,
  now,
  siteName,
}: {
  jobs: JobListItem[];
  now: number;
  siteName: string;
}) {
  const shown = jobs.slice(0, EXAMPLE_EMAIL_JOBS);
  if (shown.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="alerts-example-title"
      className="bg-card ring-line flex w-full flex-col gap-3 rounded-[14px] p-[18px] ring-1 md:gap-[14px] md:p-5"
      data-testid="alerts-example"
    >
      <p className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase">
        Example email
      </p>
      <h2
        className="text-foreground text-[15px] leading-[18px] font-medium"
        id="alerts-example-title"
      >
        {digestSubject(shown.length, siteName)}
      </h2>
      <ul className="flex flex-col">
        {shown.map((job) => (
          <ExampleRow job={job} key={job.id} now={now} />
        ))}
      </ul>
      <p className="text-subtle hidden text-[13px] leading-4 md:block">
        We only email when there is something new.
      </p>
    </section>
  );
}
