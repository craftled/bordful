import Link from "next/link";

import { BoardShell } from "@/components/board/board-shell";
import { compactRelative } from "@/components/board/job-row";
import {
  formatLocation,
  formatRelativePosted,
  formatSalary,
} from "@/lib/board/format";
import { BOARD_SEARCH_PATH, buildJobPath } from "@/lib/board/paths";
import { listPublishedJobs } from "@/lib/read";
import type { JobListItem } from "@/lib/read/types";

const LATEST_ROLES = 3;
const LOCATION_FALLBACK = "Location not listed";

async function loadLatestRoles(): Promise<JobListItem[]> {
  try {
    const listed = await listPublishedJobs({ limit: LATEST_ROLES, page: 1 });
    return listed.items.slice(0, LATEST_ROLES);
  } catch {
    return [];
  }
}

export default async function NotFound() {
  const latest = await loadLatestRoles();
  const now = Date.now();

  return (
    <BoardShell fullBleed>
      <div
        className="mx-auto flex w-full max-w-[1072px] flex-col items-center gap-3 px-4 pt-11 pb-16 text-center min-[1104px]:px-0 md:gap-4 md:pt-16 md:pb-[72px]"
        data-page="not-found"
      >
        <p className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase">
          Error 404
        </p>
        <div className="flex flex-col items-center">
          <p
            aria-hidden="true"
            className="text-foreground text-[64px] leading-[78px] font-medium tracking-[-0.045em] md:text-[88px] md:leading-[106px]"
          >
            404
          </p>
          <h1 className="text-subtle text-[24px] leading-[30px] font-medium tracking-[-0.03em] md:text-[32px] md:leading-10">
            Page not found.
          </h1>
        </div>
        <p className="text-muted-foreground text-[14px] leading-[18px] md:text-[15px]">
          <span className="md:hidden">The page moved or never existed.</span>
          <span className="hidden md:inline">
            The page moved or never existed. Try a search, or start from the
            latest roles.
          </span>
        </p>
        <search className="mt-2 w-full max-w-[480px] md:mt-6">
          <form action={BOARD_SEARCH_PATH}>
            <input
              aria-label="Search jobs"
              className="bg-card border-line-strong placeholder:text-subtle text-foreground h-11 w-full rounded-[10px] border px-3.5 text-[14px] shadow-xs dark:border-white/12"
              name="q"
              placeholder="Search jobs by role, company or skill"
              type="search"
            />
          </form>
        </search>
        {latest.length === 0 ? (
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex h-7 items-center rounded-lg px-2.5 text-[13px] font-medium"
            href="/"
          >
            Latest jobs
          </Link>
        ) : null}
        {latest.length > 0 ? (
          <section
            aria-labelledby="latest-roles-title"
            className="mt-2 flex w-full flex-col gap-2.5 text-left md:mt-10 md:gap-3.5"
            data-testid="not-found-latest"
          >
            <h2
              className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase"
              id="latest-roles-title"
            >
              Latest roles
            </h2>
            <ul className="bg-card ring-line divide-line grid gap-4 max-md:gap-0 max-md:divide-y max-md:overflow-hidden max-md:rounded-[14px] max-md:ring-1 max-md:ring-inset md:grid-cols-2 md:bg-transparent md:ring-0 lg:grid-cols-3">
              {latest.map((job) => {
                const location = formatLocation(job);
                const salary = formatSalary(job);
                const posted = job.publishedAt
                  ? formatRelativePosted(job.publishedAt, now)
                  : "";
                // Paper shows the list's short age ("2h") on every width;
                // the full phrase stays in the tooltip.
                const age = job.publishedAt
                  ? compactRelative(job.publishedAt, now)
                  : "";
                const subtitle = [
                  job.companyName,
                  location === LOCATION_FALLBACK ? "" : location,
                ]
                  .filter((part) => part.length > 0)
                  .join(" · ");

                return (
                  <li
                    className="ring-line hover:bg-selected md:bg-card relative transition-colors has-[:focus-visible]:ring-2 max-md:grid max-md:grid-cols-[40px_1fr] max-md:gap-x-3 max-md:gap-y-[3px] max-md:p-[14px] md:flex md:flex-col md:gap-3 md:rounded-[14px] md:p-[18px] md:ring-1 md:ring-inset"
                    key={job.id}
                  >
                    <div className="flex justify-between max-md:contents">
                      <span
                        aria-hidden="true"
                        className="bg-tag text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-lg text-[13px] font-medium max-md:col-start-1 max-md:row-span-3 max-md:row-start-1 md:size-8"
                      >
                        {job.companyName.trim().charAt(0).toUpperCase()}
                      </span>
                      {posted ? (
                        <span
                          className="text-subtle text-[12px] leading-4 max-md:col-start-2 max-md:row-start-1 max-md:justify-self-end max-md:leading-[18px]"
                          title={posted}
                        >
                          {age || posted}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5 max-md:contents">
                      <h3 className="text-foreground text-[15px] leading-[18px] font-medium max-md:col-start-2 max-md:row-start-1 max-md:pr-10">
                        <Link
                          className="rounded-sm outline-none after:absolute after:inset-0"
                          href={buildJobPath(job.slug)}
                        >
                          {job.title}
                        </Link>
                      </h3>
                      {subtitle ? (
                        <p className="text-muted-foreground truncate text-[13px] leading-4 max-md:col-start-2 max-md:row-start-2">
                          {subtitle}
                        </p>
                      ) : null}
                    </div>
                    {salary ? (
                      <p className="text-foreground text-[13px] leading-4 font-medium max-md:col-start-2 max-md:row-start-3">
                        {salary}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </BoardShell>
  );
}
