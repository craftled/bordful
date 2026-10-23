import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { boardHomePath } from "@/config/nav";

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
        <li>
          <Link className="hover:text-foreground" href="/">
            Home
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3.5" />
        </li>
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
        <li className="min-w-0 truncate text-foreground" title={title}>
          <span aria-current="page">{title}</span>
        </li>
      </ol>
    </nav>
  );
}
