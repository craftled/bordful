import Link from "next/link";
import type { ReactNode } from "react";

import { boardHomePath } from "@/config/nav";

function Separator() {
  return (
    <li aria-hidden="true" className="text-subtle">
      /
    </li>
  );
}

// In board mode the site root is the job list, so a separate Home crumb would link to the same page.
// Paper ends the trail with "Title at Company" on desktop and just the company
// on phones, where the title sits right below.
export function JobBreadcrumb({
  actions,
  companyName,
  marketing,
  title,
}: {
  actions?: ReactNode;
  companyName?: string;
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
          {marketing ? (
            <>
              <li className="shrink-0">
                <Link className="hover:text-foreground" href="/">
                  Home
                </Link>
              </li>
              <Separator />
            </>
          ) : null}
          <li className="shrink-0">
            <Link className="hover:text-foreground" href={jobsHref}>
              Jobs
            </Link>
          </li>
          <Separator />
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
      <div className="-my-2 flex shrink-0 items-center gap-1 sm:my-0">
        <Link
          className="text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md font-medium sm:inline sm:size-auto"
          href={jobsHref}
        >
          <span aria-hidden="true">←</span>
          <span className="sr-only sm:not-sr-only">&nbsp;All jobs</span>
        </Link>
        {actions}
      </div>
    </div>
  );
}
