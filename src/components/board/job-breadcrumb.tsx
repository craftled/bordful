import Link from "next/link";

import { boardHomePath } from "@/config/nav";

function Separator() {
  return (
    <li aria-hidden="true" className="text-subtle">
      /
    </li>
  );
}

// In board mode the site root is the job list, so a separate Home crumb would link to the same page.
export function JobBreadcrumb({
  marketing,
  title,
}: {
  marketing: boolean;
  title: string;
}) {
  const jobsHref = boardHomePath(marketing);

  return (
    <div className="flex items-center justify-between gap-4 text-[13px] leading-[18px]">
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
            title={title}
          >
            <span aria-current="page">{title}</span>
          </li>
        </ol>
      </nav>
      <Link
        className="text-muted-foreground hover:text-foreground hidden shrink-0 font-medium sm:inline"
        href={jobsHref}
      >
        <span aria-hidden="true">← </span>All jobs
      </Link>
    </div>
  );
}
