import Link from "next/link";

import { jobCountLabel } from "@/components/board/board-list";
import { buildCompanyPath } from "@/lib/board/paths";

export function CompanyCard({
  count,
  name,
  slug,
}: {
  count: number;
  name: string;
  slug: string;
}) {
  return (
    <Link
      className="block rounded-lg border bg-card p-4 outline-none transition-colors hover:border-zinc-300 focus-visible:ring-2 focus-visible:ring-ring"
      href={buildCompanyPath(slug)}
    >
      <span className="block font-medium text-base" data-testid="company-name">
        {name}
      </span>
      <span className="block text-muted-foreground text-sm">
        {jobCountLabel(count)}
      </span>
    </Link>
  );
}
