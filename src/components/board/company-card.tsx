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
      className="bg-card focus-visible:ring-ring block rounded-lg border p-4 transition-colors outline-none hover:border-zinc-300 focus-visible:ring-2"
      href={buildCompanyPath(slug)}
    >
      <span className="block text-base font-medium" data-testid="company-name">
        {name}
      </span>
      <span className="text-muted-foreground block text-sm">
        {jobCountLabel(count)}
      </span>
    </Link>
  );
}
