import Link from "next/link";

import { BoardShell } from "@/components/board/board-shell";
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
      <div className="mx-auto flex w-full max-w-[1072px] flex-col items-center gap-4 px-4 pt-12 pb-16 text-center md:pt-16 md:pb-[72px]">
        <p className="text-subtle font-mono text-[11px] font-medium tracking-[0.04em] uppercase">
          Error 404
        </p>
        <div className="flex flex-col items-center">
          <p
            aria-hidden="true"
            className="text-foreground text-[64px] leading-[76px] font-medium tracking-[-0.045em] md:text-[88px] md:leading-[106px]"
          >
            404
          </p>
          <h1 className="text-subtle text-[24px] leading-8 font-medium tracking-[-0.03em] md:text-[32px] md:leading-10">
            Page not found.
          </h1>
        </div>
        <p className="text-muted-foreground text-[15px] leading-[18px]">
          The page moved or never existed. Try a search, or start from the
          latest roles.
        </p>
        <search className="mt-2 w-full max-w-[480px]">
          <form action={BOARD_SEARCH_PATH}>
            <input
              aria-label="Search jobs"
              className="bg-card border-line placeholder:text-subtle text-foreground h-11 w-full rounded-[10px] border px-3.5 text-[14px] shadow-xs"
              name="q"
              placeholder="Search jobs by role, company or skill"
              type="search"
            />
          </form>
        </search>
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-medium"
          href="/"
        >
          Latest jobs
        </Link>
        {latest.length > 0 ? (
          <section
            aria-labelledby="latest-roles-title"
            className="mt-6 flex w-full flex-col gap-3.5 text-left"
            data-testid="not-found-latest"
          >
            <h2
              className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase"
              id="latest-roles-title"
            >
              Latest roles
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latest.map((job) => {
                const location = formatLocation(job);
                const salary = formatSalary(job);
                const posted = job.publishedAt
                  ? formatRelativePosted(job.publishedAt, now)
                  : "";
                const subtitle = [
                  job.companyName,
                  location === LOCATION_FALLBACK ? "" : location,
                ]
                  .filter((part) => part.length > 0)
                  .join(" · ");

                return (
                  <li
                    className="bg-card ring-line hover:bg-selected relative flex flex-col gap-3 rounded-[14px] p-[18px] ring-1 transition-colors ring-inset has-[:focus-visible]:ring-2"
                    key={job.id}
                  >
                    <div className="flex justify-between">
                      <span
                        aria-hidden="true"
                        className="bg-tag text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-md text-[13px] font-medium"
                      >
                        {job.companyName.trim().charAt(0).toUpperCase()}
                      </span>
                      {posted ? (
                        <span className="text-subtle text-[12px] leading-4">
                          {posted}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h3 className="text-foreground text-[15px] leading-[18px] font-medium">
                        <Link
                          className="rounded-sm outline-none after:absolute after:inset-0"
                          href={buildJobPath(job.slug)}
                        >
                          {job.title}
                        </Link>
                      </h3>
                      {subtitle ? (
                        <p className="text-muted-foreground truncate text-[13px] leading-4">
                          {subtitle}
                        </p>
                      ) : null}
                    </div>
                    {salary ? (
                      <p className="text-foreground text-[13px] leading-4 font-medium">
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
