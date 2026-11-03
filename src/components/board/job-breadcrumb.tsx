import Link from "next/link";
import type { ReactNode } from "react";

import { boardHomePath } from "@/config/nav";
import { BOARD_SEARCH_PATH, buildTaxonomyArchivePath } from "@/lib/board/paths";
import { taxonomyLabel, taxonomyValuesFor } from "@/lib/board/taxonomy";
import type { JobListItem } from "@/lib/read/types";
import { cn } from "@/lib/utils";

// The board joins list values with a bare ",", so a category holding one
// cannot round-trip through the search URL.
const BARE_COMMA = /,(?!\s)/u;

function Separator({ className }: { className?: string }) {
  return (
    <li aria-hidden="true" className={cn("text-subtle", className)}>
      /
    </li>
  );
}

export interface JobCrumb {
  href: string;
  label: string;
}

/** The job's first category, linked to the board filtered to it. */
export function categoryCrumb(
  job: Pick<JobListItem, "categories">
): JobCrumb | null {
  const label = job.categories.map((value) => value.trim()).find(Boolean);
  if (!label || BARE_COMMA.test(label)) {
    return null;
  }
  const params = new URLSearchParams({ categories: label.toLowerCase() });
  return { href: `${BOARD_SEARCH_PATH}?${params.toString()}`, label };
}

/** The job's location archive: Remote first, else its country. */
export function locationCrumb(job: JobListItem): JobCrumb | null {
  const [slug] = taxonomyValuesFor(job).locations;
  if (!slug) {
    return null;
  }
  return {
    href: buildTaxonomyArchivePath("location", slug),
    label: taxonomyLabel("location", slug),
  };
}

// Paper's trail is "Jobs / category / location / Title at Company" on
// desktop and "Jobs / category / Company" on phones, where the title sits
// right below. Category and location only appear when the job has them, and
// each links to the board page that lists that slice.
export function JobBreadcrumb({
  actions,
  category,
  companyName,
  location,
  marketing,
  title,
}: {
  actions?: ReactNode;
  category?: JobCrumb | null;
  companyName?: string;
  location?: JobCrumb | null;
  marketing: boolean;
  title: string;
}) {
  const jobsHref = boardHomePath(marketing);
  const company = companyName?.trim() ?? "";
  const full = company ? `${title} at ${company}` : title;

  return (
    <div className="flex items-center justify-between gap-4 text-[13px] leading-4 sm:leading-[18px]">
      <nav
        aria-label="Breadcrumb"
        className="text-subtle sm:text-muted-foreground min-w-0"
      >
        <ol className="flex min-w-0 items-center gap-2">
          <li className="shrink-0">
            <Link className="hover:text-foreground" href={jobsHref}>
              Jobs
            </Link>
          </li>
          <Separator />
          {category ? (
            <>
              <li className="shrink-0">
                <Link className="hover:text-foreground" href={category.href}>
                  {category.label}
                </Link>
              </li>
              <Separator />
            </>
          ) : null}
          {location ? (
            <>
              <li className="hidden shrink-0 sm:list-item">
                <Link className="hover:text-foreground" href={location.href}>
                  {location.label}
                </Link>
              </li>
              <Separator className="hidden sm:block" />
            </>
          ) : null}
          <li
            className="text-foreground min-w-0 truncate sm:font-medium"
            title={full}
          >
            <span aria-current="page">
              {company ? (
                <>
                  <span className="sm:hidden">{company}</span>
                  <span className="hidden sm:inline">{full}</span>
                </>
              ) : (
                title
              )}
            </span>
          </li>
        </ol>
      </nav>
      {/* Paper's phone trail is crumbs only: Save lives in the sticky bar. */}
      <div className="hidden shrink-0 items-center gap-1 sm:flex">
        <Link
          className="text-muted-foreground hover:text-foreground inline font-medium"
          href={jobsHref}
        >
          <span aria-hidden="true">←</span>
          <span>&nbsp;All jobs</span>
        </Link>
        {actions}
      </div>
    </div>
  );
}
