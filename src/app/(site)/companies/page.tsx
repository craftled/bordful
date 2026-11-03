import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { CompanyCard } from "@/components/board/company-card";
import { companiesFromPool } from "@/lib/board/companies";
import { loadBoardPool } from "@/lib/board/pool";

export const metadata: Metadata = {
  title: "Companies",
};

export default async function CompaniesPage() {
  const rows = companiesFromPool(await loadBoardPool());

  return (
    <BoardShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="font-[var(--font-heading)] text-3xl font-semibold">
            Companies
          </h1>
          <p className="text-muted-foreground">
            {rows.length === 1
              ? "1 company with open jobs"
              : `${rows.length} companies with open jobs`}
          </p>
        </header>
        {rows.length > 0 ? (
          <ul className="space-y-3" data-testid="company-list">
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
          <p>No companies with open jobs.</p>
        )}
      </div>
    </BoardShell>
  );
}
