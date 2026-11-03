import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { CompanyDirectory } from "@/components/board/company-directory";
import { Crumbs, PageTitle } from "@/components/board/taxonomy-hub";
import { companiesFromPool } from "@/lib/board/companies";
import { loadBoardPool } from "@/lib/board/pool";

export const metadata: Metadata = {
  title: "Companies",
};

export default async function CompaniesPage() {
  const pool = await loadBoardPool();
  const rows = companiesFromPool(pool);

  return (
    <BoardShell>
      <div className="space-y-8">
        <Crumbs
          items={[{ href: "/jobs", label: "Jobs" }, { label: "Companies" }]}
        />
        <PageTitle
          subtitle={`${rows.length} ${rows.length === 1 ? "company" : "companies"}, ${pool.length} open ${pool.length === 1 ? "role" : "roles"}.`}
        >
          Companies hiring
        </PageTitle>
        {rows.length > 0 ? (
          <CompanyDirectory rows={rows} />
        ) : (
          <p className="text-muted-foreground">No companies with open jobs.</p>
        )}
      </div>
    </BoardShell>
  );
}
