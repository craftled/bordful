import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { boardHomePath } from "@/config/nav";

// In board mode the site root is the job list, so a separate Home crumb would link to the same page.
export function JobBreadcrumb({
  marketing,
  title,
}: {
  marketing: boolean;
  title: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
      <ol className="flex min-w-0 items-center gap-2">
        {marketing ? (
          <>
            <li>
              <Link className="hover:text-foreground" href="/">
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="size-3.5" />
            </li>
          </>
        ) : null}
        <li>
          <Link
            className="hover:text-foreground"
            href={boardHomePath(marketing)}
          >
            Jobs
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5" />
        </li>
        <li className="text-foreground min-w-0 truncate" title={title}>
          <span aria-current="page">{title}</span>
        </li>
      </ol>
    </nav>
  );
}
