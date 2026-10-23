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
        <h1 className="font-[var(--font-heading)] font-semibold text-3xl">
          Companies
        </h1>
        {rows.length > 0 ? (
          <ul className="divide-y divide-border" data-testid="company-list">
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
