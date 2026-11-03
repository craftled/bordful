import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { CompanyCard } from "@/components/board/company-card";
import { Crumbs, PageTitle } from "@/components/board/taxonomy-hub";
import { companiesFromPool } from "@/lib/board/companies";
import { loadBoardPool } from "@/lib/board/pool";

export const metadata: Metadata = {
  title: "Companies",
};

export default async function CompaniesPage() {
  const rows = companiesFromPool(await loadBoardPool());

  return (
    <BoardShell>
      <div className="space-y-8">
        <Crumbs
          items={[{ href: "/jobs", label: "Jobs" }, { label: "Companies" }]}
        />
        <PageTitle
          subtitle={
            rows.length === 1
              ? "1 company with open jobs."
              : `${rows.length} companies with open jobs.`
          }
        >
          Companies hiring
        </PageTitle>
        {rows.length > 0 ? (
          <ul
            className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3"
            data-testid="company-list"
          >
            {rows.map((row) => (
              <li
                data-company-slug={row.slug}
                data-testid="company-row"
                key={row.slug}
              >
                <CompanyCard
                  count={row.count}
                  name={row.name}
                  slug={row.slug}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No companies with open jobs.</p>
        )}
      </div>
    </BoardShell>
  );
}
