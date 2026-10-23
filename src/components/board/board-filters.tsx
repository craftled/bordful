import Link from "next/link";
import type { BoardFacets } from "@/lib/board/filter";
import { boardStateHref } from "@/lib/board/links";
import {
  type BoardQuery,
  type BoardQueryOptions,
  type BoardSort,
  boardQueryHasFilters,
  clearBoardFilters,
} from "@/lib/board/query";
import { languageLabel } from "@/lib/board/taxonomy";
import {
  JOB_EMPLOYMENT_LABELS,
  type JobEmploymentType,
  type JobSeniority,
  SALARY_BAND_IDS,
  type SalaryBandId,
  SENIORITIES,
} from "@/lib/domain/job-vocab";

const SENIORITY_LABELS: Record<JobSeniority, string> = {
  c_level: "C-level",
  director: "Director",
  entry: "Entry",
  intern: "Intern",
  lead: "Lead",
  mid: "Mid",
  principal: "Principal",
  senior: "Senior",
  vp: "VP",
};

function FilterLink({
  active,
  count,
  href,
  label,
  testId,
}: {
  active: boolean;
  count: number;
  href: string;
  label: string;
  testId: string;
}) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className={
        active
          ? "flex items-center justify-between gap-2 rounded-[var(--radius)] bg-primary px-2 py-1 text-primary-foreground text-sm"
          : "flex items-center justify-between gap-2 rounded-[var(--radius)] px-2 py-1 text-sm hover:bg-muted"
      }
      data-active={active ? "true" : undefined}
      data-testid={testId}
      href={href}
    >
      <span>{label}</span>
      <span data-count={count} data-testid="facet-count">
        {count}
      </span>
    </Link>
  );
}

function toggleValue<T extends string>(
  values: T[],
  value: T,
  active: boolean
): T[] {
  if (active) {
    return values.filter((item) => item !== value);
  }

  return [...values, value];
}

export function BoardFilters({
  facets,
  marketing,
  options,
  query,
}: {
  facets: BoardFacets;
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
}) {
  const hrefFor = (next: BoardQuery) =>
    boardStateHref({ ...next, page: 1 }, options, marketing);
  const typeCounts = new Map(
    facets.types.map((facet) => [facet.value, facet.count])
  );
  const levelCounts = new Map(
    facets.seniority.map((facet) => [facet.value, facet.count])
  );
  const salaryCounts = new Map(
    facets.salary.map((facet) => [facet.value, facet.count])
  );

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-sm">Filters</h2>
        {boardQueryHasFilters(query) ? (
          <Link
            data-testid="filter-clear"
            href={boardStateHref(clearBoardFilters(query), options, marketing)}
          >
            Clear
          </Link>
        ) : null}
      </div>
      <fieldset className="space-y-1">
        <legend className="mb-2 font-semibold text-sm">Job type</legend>
        {facets.types.map((facet) => {
          const value = facet.value as JobEmploymentType;
          const active = query.types.includes(value);
          return (
            <FilterLink
              active={active}
              count={typeCounts.get(value) ?? 0}
              href={hrefFor({
                ...query,
                types: toggleValue(query.types, value, active),
              })}
              key={value}
              label={JOB_EMPLOYMENT_LABELS[value]}
              testId={`filter-type-${value}`}
            />
          );
        })}
      </fieldset>
      <fieldset className="space-y-1">
        <legend className="mb-2 font-semibold text-sm">Workplace</legend>
        <FilterLink
          active={query.remote}
          count={facets.remote}
          href={hrefFor({ ...query, remote: !query.remote })}
          label="Remote"
          testId="filter-remote"
        />
      </fieldset>
      <fieldset className="space-y-1">
        <legend className="mb-2 font-semibold text-sm">Salary</legend>
        {SALARY_BAND_IDS.map((band, index) => {
          const active = query.salary.includes(band);
          return (
            <FilterLink
              active={active}
              count={salaryCounts.get(band) ?? 0}
              href={hrefFor({
                ...query,
                salary: toggleValue<SalaryBandId>(query.salary, band, active),
              })}
              key={band}
              label={band}
              testId={`filter-salary-${index}`}
            />
          );
        })}
      </fieldset>
      <fieldset className="space-y-1">
        <legend className="mb-2 font-semibold text-sm">Level</legend>
        {SENIORITIES.map((level) => {
          const count = levelCounts.get(level) ?? 0;
          if (count === 0 && !query.seniority.includes(level)) {
            return null;
          }
          const active = query.seniority.includes(level);
          return (
            <FilterLink
              active={active}
              count={count}
              href={hrefFor({
                ...query,
                seniority: toggleValue(query.seniority, level, active),
              })}
              key={level}
              label={SENIORITY_LABELS[level]}
              testId={`filter-level-${level}`}
            />
          );
        })}
      </fieldset>
      {facets.languages.length > 0 ? (
        <fieldset className="space-y-1">
          <legend className="mb-2 font-semibold text-sm">Language</legend>
          {facets.languages.map((facet) => {
            const active = query.languages.includes(facet.value);
            return (
              <FilterLink
                active={active}
                count={facet.count}
                href={hrefFor({
                  ...query,
                  languages: toggleValue(query.languages, facet.value, active),
                })}
                key={facet.value}
                label={languageLabel(facet.value)}
                testId={`filter-language-${facet.value}`}
              />
            );
          })}
        </fieldset>
      ) : null}
      <fieldset className="space-y-1">
        <legend className="mb-2 font-semibold text-sm">Visa</legend>
        <FilterLink
          active={query.visa}
          count={facets.visa}
          href={hrefFor({ ...query, visa: !query.visa })}
          label="Visa sponsorship"
          testId="filter-visa"
        />
      </fieldset>
    </aside>
  );
}

export function SortLinks({
  marketing,
  options,
  query,
}: {
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
}) {
  const sorts: { id: BoardSort; label: string }[] = [
    { id: "newest", label: "Newest" },
    { id: "oldest", label: "Oldest" },
    { id: "salary", label: "Salary" },
  ];

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {sorts.map((sort) => {
        const active = query.sort === sort.id;
        return (
          <Link
            aria-current={active ? "true" : undefined}
            data-active={active ? "true" : undefined}
            href={boardStateHref(
              { ...query, page: 1, sort: sort.id },
              options,
              marketing
            )}
            key={sort.id}
          >
            {sort.label}
          </Link>
        );
      })}
    </div>
  );
}
