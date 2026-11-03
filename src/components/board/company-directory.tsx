"use client";

import {
  type ChangeEvent,
  type MouseEvent,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";

import { CompanyCard } from "@/components/board/company-card";
import { PageTitle } from "@/components/board/taxonomy-hub";
import type { CompanyIndexRow } from "@/lib/board/companies";
import { cn } from "@/lib/utils";

export interface CompanyDirectoryRow extends CompanyIndexRow {
  hiringThisWeek: boolean;
  location: string | null;
  remoteFirst: boolean;
}

export type CompanyFilter = "all" | "remote" | "week";

const FILTER_LABEL: Record<CompanyFilter, string> = {
  all: "All",
  remote: "Remote-first",
  week: "Hiring this week",
};

// Paper shows three rows of cards, then a link to the rest.
export const COMPANY_PAGE_SIZE = 9;

/** Filters that have at least one company behind them, "All" first. */
export function availableFilters(
  rows: readonly CompanyDirectoryRow[]
): CompanyFilter[] {
  const filters: CompanyFilter[] = ["all"];
  if (rows.some((row) => row.hiringThisWeek)) {
    filters.push("week");
  }
  if (rows.some((row) => row.remoteFirst)) {
    filters.push("remote");
  }
  return filters;
}

export function filterCompanies(
  rows: readonly CompanyDirectoryRow[],
  filter: CompanyFilter,
  term: string
): CompanyDirectoryRow[] {
  const needle = term.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (filter === "all" ||
        (filter === "week" && row.hiringThisWeek) ||
        (filter === "remote" && row.remoteFirst)) &&
      (needle.length === 0 || row.name.toLowerCase().includes(needle))
  );
}

/** The All / Hiring this week / Remote-first control, shown beside the page title. */
export function CompanyFilterTabs({
  filter,
  filters,
  onChange,
}: {
  filter: CompanyFilter;
  filters: readonly CompanyFilter[];
  onChange: (filter: CompanyFilter) => void;
}) {
  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const value = event.currentTarget.dataset.filter as CompanyFilter;
      onChange(value);
    },
    [onChange]
  );
  if (filters.length < 2) {
    return null;
  }
  return (
    <fieldset className="bg-tag m-0 flex w-fit min-w-0 shrink-0 gap-0.5 rounded-lg border-0 p-0.5">
      <legend className="sr-only">Filter companies</legend>
      {filters.map((value) => {
        const active = value === filter;
        return (
          <button
            aria-pressed={active}
            className={cn(
              "h-6 rounded-md px-3 text-[13px] leading-4 transition-colors",
              active
                ? "bg-card text-foreground font-medium shadow-[0_0_0_1px_var(--line),0_1px_2px_rgb(0_0_0/0.05)]"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-filter={value}
            data-testid={`company-filter-${value}`}
            key={value}
            onClick={onClick}
            type="button"
          >
            {FILTER_LABEL[value]}
          </button>
        );
      })}
    </fieldset>
  );
}

// Filters the rendered cards in the browser. The first page of cards is in
// the server HTML, so the list works without JavaScript up to "Show all".
export function CompanyDirectory({
  rows,
  subtitle,
  title,
}: {
  rows: CompanyDirectoryRow[];
  subtitle: string;
  title: string;
}) {
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<CompanyFilter>("all");
  const [expanded, setExpanded] = useState(false);
  const inputId = useId();
  const onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setTerm(event.target.value),
    []
  );
  const showAll = useCallback(() => setExpanded(true), []);
  const filters = useMemo(() => availableFilters(rows), [rows]);
  const matched = filterCompanies(rows, filter, term);
  const searching = term.trim().length > 0 || filter !== "all";
  const shown =
    expanded || searching ? matched : matched.slice(0, COMPANY_PAGE_SIZE);
  const hidden = matched.length - shown.length;

  return (
    <div className="contents">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageTitle subtitle={subtitle}>{title}</PageTitle>
        <CompanyFilterTabs
          filter={filter}
          filters={filters}
          onChange={setFilter}
        />
      </div>
      <div>
        <label className="sr-only" htmlFor={inputId}>
          Search companies
        </label>
        <input
          autoComplete="off"
          className="bg-card ring-line-strong text-foreground placeholder:text-subtle focus-visible:ring-foreground/40 h-10 w-full rounded-lg px-3 text-[14px] leading-[18px] ring-1 outline-none md:max-w-[420px]"
          data-testid="company-search"
          id={inputId}
          onChange={onChange}
          placeholder="Search companies"
          type="search"
          value={term}
        />
      </div>
      {shown.length > 0 ? (
        <div className="flex flex-col gap-3 md:gap-8">
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
                  location={row.location}
                  logoUrl={row.logoUrl}
                  name={row.name}
                  slug={row.slug}
                />
              </li>
            ))}
          </ul>
          {hidden > 0 ? (
            <div className="flex justify-center">
              <button
                className="text-subtle hover:text-foreground p-1.5 text-[13px] leading-4 transition-colors"
                data-testid="company-show-all"
                onClick={showAll}
                type="button"
              >
                Show all {matched.length} companies
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-[14px]" role="status">
          {term.trim()
            ? `No companies match "${term.trim()}".`
            : "No companies match this filter."}
        </p>
      )}
    </div>
  );
}
