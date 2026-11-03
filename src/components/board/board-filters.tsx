import { Check, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

// Longer groups show this many options, the rest sit behind "Show more".
const GROUP_PREVIEW = 5;

const ROW_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

interface FacetOption {
  active: boolean;
  count: number;
  href: string;
  label: string;
  testId: string;
}

interface FacetGroup {
  options: FacetOption[];
  title: string;
}

function FilterLink({ active, count, href, label, testId }: FacetOption) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-[var(--radius)] px-2 py-1 text-sm hover:underline",
        ROW_FOCUS
      )}
      data-active={active ? "true" : undefined}
      data-testid={testId}
      href={href}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-sm border",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-background"
        )}
      >
        {active ? <Check className="size-3" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        {label}
        {active ? <span className="sr-only"> (selected)</span> : null}
      </span>
      <span
        className="rounded-full bg-background px-2 text-muted-foreground text-xs tabular-nums"
        data-count={count}
        data-testid="facet-count"
      >
        {count}
      </span>
    </Link>
  );
}

// Options with no results are dropped, but an active one stays so the user
// can always clear it.
function FilterGroupView({ group }: { group: FacetGroup }) {
  const visible = group.options.filter(
    (option) => option.active || option.count > 0
  );
  if (visible.length === 0) {
    return null;
  }

  const shown = visible.slice(0, GROUP_PREVIEW);
  const more = visible.slice(GROUP_PREVIEW);

  return (
    <fieldset className="space-y-1">
      <legend className="mb-2 font-semibold text-sm">{group.title}</legend>
      {shown.map((option) => (
        <FilterLink {...option} key={option.testId} />
      ))}
      {more.length > 0 ? (
        <details className="group" open={more.some((option) => option.active)}>
          <summary
            className={cn(
              "w-fit cursor-pointer list-none rounded-[var(--radius)] px-2 py-1 text-sm underline underline-offset-4 [&::-webkit-details-marker]:hidden",
              ROW_FOCUS
            )}
          >
            <span className="group-open:hidden">Show more</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <div className="space-y-1">
            {more.map((option) => (
              <FilterLink {...option} key={option.testId} />
            ))}
          </div>
        </details>
      ) : null}
    </fieldset>
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

  const activeCount =
    query.types.length +
    query.seniority.length +
    query.salary.length +
    query.languages.length +
    (query.remote ? 1 : 0) +
    (query.visa ? 1 : 0);

  const groups: FacetGroup[] = [
    {
      options: facets.types.map((facet) => {
        const value = facet.value as JobEmploymentType;
        const active = query.types.includes(value);
        return {
          active,
          count: typeCounts.get(value) ?? 0,
          href: hrefFor({
            ...query,
            types: toggleValue(query.types, value, active),
          }),
          label: JOB_EMPLOYMENT_LABELS[value],
          testId: `filter-type-${value}`,
        };
      }),
      title: "Job type",
    },
    {
      options: [
        {
          active: query.remote,
          count: facets.remote,
          href: hrefFor({ ...query, remote: !query.remote }),
          label: "Remote only",
          testId: "filter-remote",
        },
      ],
      title: "Workplace",
    },
    {
      options: SENIORITIES.map((level) => {
        const active = query.seniority.includes(level);
        return {
          active,
          count: levelCounts.get(level) ?? 0,
          href: hrefFor({
            ...query,
            seniority: toggleValue(query.seniority, level, active),
          }),
          label: SENIORITY_LABELS[level],
          testId: `filter-level-${level}`,
        };
      }),
      title: "Level",
    },
    {
      options: SALARY_BAND_IDS.map((band, index) => {
        const active = query.salary.includes(band);
        return {
          active,
          count: salaryCounts.get(band) ?? 0,
          href: hrefFor({
            ...query,
            salary: toggleValue<SalaryBandId>(query.salary, band, active),
          }),
          label: band,
          testId: `filter-salary-${index}`,
        };
      }),
      title: "Salary range",
    },
    {
      options: [
        {
          active: query.visa,
          count: facets.visa,
          href: hrefFor({ ...query, visa: !query.visa }),
          label: "Visa sponsorship",
          testId: "filter-visa",
        },
      ],
      title: "Visa sponsorship",
    },
    {
      options: facets.languages.map((facet) => {
        const active = query.languages.includes(facet.value);
        return {
          active,
          count: facet.count,
          href: hrefFor({
            ...query,
            languages: toggleValue(query.languages, facet.value, active),
          }),
          label: languageLabel(facet.value),
          testId: `filter-language-${facet.value}`,
        };
      }),
      title: "Language",
    },
  ];

  // One DOM tree for both breakpoints. Below md the header row and the
  // disclosure form one bar: the disclosure sits first and takes the free
  // width, Clear all stays on its right. Above md the header comes first and
  // the disclosure wraps onto its own line, forced open by the details class.
  // Browsers without ::details-content keep the summary on md+ so the groups
  // stay reachable behind it.
  return (
    <aside
      aria-label="Filters"
      className="self-start rounded-lg border bg-muted p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="hidden font-semibold text-sm md:block">Filters</h2>
        {boardQueryHasFilters(query) ? (
          <Link
            className={cn(
              "shrink-0 py-2 text-sm underline underline-offset-4 md:py-0",
              ROW_FOCUS
            )}
            data-testid="filter-clear"
            href={boardStateHref(clearBoardFilters(query), options, marketing)}
          >
            Clear all
          </Link>
        ) : null}
        <details className="group order-first min-w-0 flex-1 md:order-none md:basis-full md:[&::details-content]:[content-visibility:visible]">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-2 rounded-[var(--radius)] border border-input bg-background px-3 py-2 text-sm supports-[selector(::details-content)]:md:hidden [&::-webkit-details-marker]:hidden",
              ROW_FOCUS
            )}
          >
            <span className="font-semibold">
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="mt-4 space-y-6 md:mt-0">
            {groups.map((group) => (
              <FilterGroupView group={group} key={group.title} />
            ))}
          </div>
        </details>
      </div>
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
