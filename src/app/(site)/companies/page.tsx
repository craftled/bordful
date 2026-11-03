import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import {
  CompanyDirectory,
  type CompanyDirectoryRow,
} from "@/components/board/company-directory";
import { Crumbs, PageFrame, PageTitle } from "@/components/board/taxonomy-hub";
import { companiesFromPool } from "@/lib/board/companies";
import { loadBoardPool } from "@/lib/board/pool";
import { companyStatsFromPool } from "@/lib/read/company-stats";

export const metadata: Metadata = {
  title: "Companies",
};

export default async function CompaniesPage() {
  const pool = await loadBoardPool();
  const stats = companyStatsFromPool(pool, Date.now());
  const rows: CompanyDirectoryRow[] = companiesFromPool(pool).map((row) => {
    const facts = stats.get(row.slug);
    return {
      ...row,
      hiringThisWeek: facts?.hiringThisWeek ?? false,
      location: facts?.location ?? null,
      remoteFirst: facts?.remoteFirst ?? false,
    };
  });
  const title = "Companies hiring";
  const subtitle = `${rows.length} ${rows.length === 1 ? "company" : "companies"}, ${pool.length} open ${pool.length === 1 ? "role" : "roles"}.`;

  return (
    <BoardShell fullBleed>
      <PageFrame>
        {/* Paper sets these crumbs on a 16px line; the shared Crumbs use 19px. */}
        <div className="md:[&>nav]:leading-4">
          <Crumbs
            items={[{ href: "/jobs", label: "Jobs" }, { label: "Companies" }]}
          />
        </div>
        {rows.length > 0 ? (
          <CompanyDirectory rows={rows} subtitle={subtitle} title={title} />
        ) : (
          <>
            <PageTitle subtitle={subtitle}>{title}</PageTitle>
            <p className="text-muted-foreground">
              No companies with open jobs.
            </p>
          </>
        )}
      </PageFrame>
    </BoardShell>
  );
}
