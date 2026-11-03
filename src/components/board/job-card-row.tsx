import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface JobCardRowProps {
  action?: ReactNode;
  companyName: string;
  href: string | null;
  initial: string;
  location: string;
  logoUrl?: string | null;
  muted?: boolean;
  pills?: ReactNode;
  salary: string;
  slug: string;
  time: string;
  timeTitle?: string;
  title: string;
}

const ROW_LINK =
  "hover:bg-surface-sub has-[:focus-visible]:ring-ring transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset";

function Logo({
  initial,
  logoUrl,
}: {
  initial: string;
  logoUrl: string | null;
}) {
  return (
    <span
      aria-hidden="true"
      className="bg-logo-tile text-muted-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[13px] leading-4 font-semibold md:size-9"
    >
      {logoUrl ? (
        // biome-ignore lint/performance/noImgElement: a 40px company mark, served as-is
        <img
          alt=""
          className="size-full object-cover"
          height={40}
          loading="lazy"
          src={logoUrl}
          width={40}
        />
      ) : (
        initial
      )}
    </span>
  );
}

function Title({
  href,
  muted,
  pills,
  title,
}: {
  href: string | null;
  muted: boolean;
  pills?: ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <h3
        className={cn(
          "min-w-0 text-[15px] leading-[18px] font-medium md:truncate",
          muted ? "text-subtle" : "text-foreground"
        )}
        title={title}
      >
        {href ? (
          <Link
            className="rounded-sm outline-none after:absolute after:inset-0"
            data-testid="job-row-link"
            href={href}
          >
            {title}
          </Link>
        ) : (
          title
        )}
      </h3>
      {pills ? (
        <span className="hidden shrink-0 items-center gap-1.5 md:flex">
          {pills}
        </span>
      ) : null}
    </div>
  );
}

function Salary({ muted, salary }: { muted: boolean; salary: string }) {
  if (!salary) {
    return null;
  }
  return (
    <span
      className={cn(
        "text-[13px] leading-4 font-medium",
        muted ? "text-subtle" : "text-foreground"
      )}
    >
      {salary}
    </span>
  );
}

function Time({
  className,
  prefix,
  time,
  title,
}: {
  className: string;
  prefix?: string;
  time: string;
  title?: string;
}) {
  if (!time) {
    return null;
  }
  return (
    <span className={cn("text-subtle text-[12px]", className)} title={title}>
      {prefix}
      {time}
    </span>
  );
}

// Phone only: salary, then the time when an action holds the top-right slot,
// then the pills.
function PhoneLine({
  action,
  muted,
  pills,
  salary,
  time,
  timeTitle,
}: Pick<
  JobCardRowProps,
  "action" | "pills" | "salary" | "time" | "timeTitle"
> & { muted: boolean }) {
  const lineTime = action ? time : "";
  if (!(salary || pills || lineTime)) {
    return null;
  }
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 md:hidden">
      <Salary muted={muted} salary={salary} />
      <Time
        className="leading-4"
        prefix={salary ? "· " : undefined}
        time={lineTime}
        title={timeTitle}
      />
      {pills}
    </div>
  );
}

// One row of Paper's bordered role list (the saved page and a company's open
// roles). Desktop: logo, title with pills over the company line, salary over
// the time on the right, then an optional action. Phone: the title wraps, a
// third line carries the salary and pills, and the time sits top right
// unless an action takes that slot.
export function JobCardRow({
  action,
  companyName,
  href,
  initial,
  location,
  logoUrl = null,
  muted = false,
  pills,
  salary,
  slug,
  time,
  timeTitle,
  title,
}: JobCardRowProps) {
  const meta = [companyName, location].filter((part) => part.length > 0);

  return (
    <li
      className="border-line border-b last:border-b-0"
      data-job-slug={slug}
      data-testid="job-row"
    >
      <article
        className={cn(
          "relative flex gap-3 py-3.5 pl-3.5 md:items-center md:pl-4",
          action ? "pr-2 md:pr-3" : "pr-4",
          href ? ROW_LINK : null
        )}
      >
        <Logo initial={initial} logoUrl={logoUrl} />
        <div className="flex min-w-0 grow basis-0 flex-col gap-[3px] md:gap-0.5">
          <Title href={href} muted={muted} pills={pills} title={title} />
          {meta.length > 0 ? (
            <p
              className={cn(
                "truncate text-[13px] leading-4",
                muted ? "text-subtle" : "text-muted-foreground"
              )}
            >
              {meta.join(" · ")}
            </p>
          ) : null}
          <PhoneLine
            action={action}
            muted={muted}
            pills={pills}
            salary={salary}
            time={time}
            timeTitle={timeTitle}
          />
        </div>
        {salary || time ? (
          <div className="hidden shrink-0 flex-col items-end gap-0.5 md:flex">
            <Salary muted={muted} salary={salary} />
            <Time className="leading-4" time={time} title={timeTitle} />
          </div>
        ) : null}
        {action ? (
          <div className="relative z-10 shrink-0 self-start md:self-auto">
            {action}
          </div>
        ) : (
          <Time
            className="shrink-0 leading-[18px] md:hidden"
            time={time}
            title={timeTitle}
          />
        )}
      </article>
    </li>
  );
}

/** The bordered card Paper sets role rows in. */
export function JobCardList({
  children,
  testId,
}: {
  children: ReactNode;
  testId?: string;
}) {
  return (
    <ul
      className="bg-card ring-line flex flex-col overflow-clip rounded-[14px] ring-1"
      data-testid={testId}
    >
      {children}
    </ul>
  );
}
