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
    <Link className="block space-y-1 py-3" href={buildCompanyPath(slug)}>
      <span className="font-medium" data-testid="company-name">
        {name}
      </span>
      <span className="block text-muted-foreground text-sm">
        {jobCountLabel(count)}
      </span>
    </Link>
  );
}
