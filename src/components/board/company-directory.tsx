"use client";

import { type ChangeEvent, useCallback, useId, useState } from "react";

import { CompanyCard } from "@/components/board/company-card";
import type { CompanyIndexRow } from "@/lib/board/companies";

// Filters the rendered cards by name in the browser. Every card is in the
// server HTML first, so the list works without JavaScript.
export function CompanyDirectory({ rows }: { rows: CompanyIndexRow[] }) {
  const [term, setTerm] = useState("");
  const inputId = useId();
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setTerm(event.target.value),
    []
  );
  const needle = term.trim().toLowerCase();
  const shown =
    needle.length === 0
      ? rows
      : rows.filter((row) => row.name.toLowerCase().includes(needle));

  return (
    <div className="space-y-6">
      <div>
        <label className="sr-only" htmlFor={inputId}>
          Search companies
        </label>
        <input
          autoComplete="off"
          className="bg-card ring-line-strong text-foreground placeholder:text-subtle focus-visible:ring-foreground/40 h-10 w-full rounded-md px-3 text-[14px] ring-1 outline-none md:max-w-[420px]"
          data-testid="company-search"
          id={inputId}
          onChange={onChange}
          placeholder="Search companies"
          type="search"
          value={term}
        />
      </div>
      {shown.length > 0 ? (
        <ul
          className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3"
          data-testid="company-list"
        >
          {shown.map((row) => (
            <li
              data-company-slug={row.slug}
              data-testid="company-row"
              key={row.slug}
            >
              <CompanyCard
                count={row.count}
                logoUrl={row.logoUrl}
                name={row.name}
                slug={row.slug}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-[14px]" role="status">
          No companies match "{term.trim()}".
        </p>
      )}
    </div>
  );
}
