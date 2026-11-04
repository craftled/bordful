import { ListFilter, X } from "lucide-react";
import Link from "next/link";
import { MenuDetails } from "@/components/board/menu-details";
import type { BoardFacets } from "@/lib/board/filter";
import { SENIORITY_LABELS } from "@/lib/board/format";
import { boardStateHref } from "@/lib/board/links";
import { slugifyTaxonomyValue } from "@/lib/board/paths";
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
  SALARY_BAND_IDS,
  type SalaryBandId,
  SENIORITIES,
} from "@/lib/domain/job-vocab";
import { cn } from "@/lib/utils";

// The rail doubles as the phone filter sheet. The toolbar's filter buttons
// open it with the native popover API, so it needs no client JS.
export const FILTERS_SHEET_ID = "board-filters";

// Longer groups show this many options, the rest sit behind "Show more".
const GROUP_PREVIEW = 5;

const ROW_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export interface FacetOption {
  active: boolean;
  count: number;
  href: string;
  label: string;
  testId: string;
}

export interface FacetGroup {
  // Short name for the toolbar chip ("Type", "Level").
  chip: string;
  // Drops every value of this group, keeping the rest of the query.
  clearHref: string;
  id: string;
  options: FacetOption[];
  title: string;
  // A single on/off option (remote, visa) renders as a switch.
  toggle: boolean;
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

// An active category no job carries any more still gets an option, so it
// can be cleared.
function categoryFacets(facets: BoardFacets, query: BoardQuery) {
  const known = new Set(facets.categories.map((facet) => facet.value));
  return [
    ...facets.categories,
    ...query.categories
      .filter((value) => !known.has(value))
      .map((value) => ({ count: 0, label: value, value })),
  ];
}

// Options with no results are dropped, but an active one stays so the user
// can always clear it.
export function visibleOptions(group: FacetGroup): FacetOption[] {
  return group.options.filter((option) => option.active || option.count > 0);
}

export function buildFilterGroups({
  facets,
  marketing,
  options,
  query,
}: {
  facets: BoardFacets;
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
}): FacetGroup[] {
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

  return [
    {
      chip: "Category",
      clearHref: hrefFor({ ...query, categories: [] }),
      id: "category",
      options: categoryFacets(facets, query).map((facet) => {
        const active = query.categories.includes(facet.value);
        return {
          active,
          count: facet.count,
          href: hrefFor({
            ...query,
            categories: toggleValue(query.categories, facet.value, active),
          }),
          label: facet.label ?? facet.value,
          testId: `filter-category-${slugifyTaxonomyValue(facet.value)}`,
        };
      }),
      title: "Category",
      toggle: false,
    },
    {
      chip: "Type",
      clearHref: hrefFor({ ...query, types: [] }),
      id: "type",
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
      toggle: false,
    },
    {
      chip: "Level",
      clearHref: hrefFor({ ...query, seniority: [] }),
      id: "level",
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
      toggle: false,
    },
    {
      chip: "Salary",
      clearHref: hrefFor({ ...query, salary: [] }),
      id: "salary",
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
      toggle: false,
    },
    {
      chip: "Language",
      clearHref: hrefFor({ ...query, languages: [] }),
      id: "language",
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
      toggle: false,
    },
    {
      chip: "Remote",
      clearHref: hrefFor({ ...query, remote: false }),
      id: "remote",
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
      toggle: true,
    },
    {
      chip: "Visa sponsorship",
      clearHref: hrefFor({ ...query, visa: false }),
      id: "visa",
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
      toggle: true,
    },
  ];
}

function Switch({ on, size }: { on: boolean; size: "lg" | "sm" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 rounded-full transition-colors",
        size === "lg" ? "h-[26px] w-11 p-[3px]" : "h-3.5 w-6 p-0.5",
        on && "bg-primary",
        !on &&
          (size === "lg"
            ? "bg-line-strong"
            : "bg-tag ring-line-strong ring-1 ring-inset")
      )}
    >
      <span
        className={cn(
          "rounded-full transition-transform",
          size === "lg" ? "size-5" : "size-2.5",
          on && (size === "lg" ? "translate-x-[18px]" : "translate-x-2.5"),
          on && "bg-primary-foreground",
          !on &&
            (size === "lg"
              ? "dark:bg-subtle bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)]"
              : "bg-subtle")
        )}
      />
    </span>
  );
}

// A pill in the phone sheet, or a row with a switch for on/off groups. The
// desktop chips carry the e2e test ids, so these get a "sheet-" prefix.
function FilterLink({
  active,
  href,
  label,
  testId,
  toggle,
}: FacetOption & { toggle: boolean }) {
  return (
    <Link
      aria-current={active ? "true" : undefined}
      className={cn(
        ROW_FOCUS,
        "items-center gap-2 transition-colors",
        toggle
          ? "flex w-full justify-between text-[15px] font-semibold"
          : "inline-flex h-9 rounded-full px-3.5 text-[14px] font-medium ring-1 ring-inset",
        !toggle &&
          (active
            ? "bg-primary text-primary-foreground ring-primary"
            : "text-foreground ring-line-strong")
      )}
      data-active={active ? "true" : undefined}
      data-testid={`sheet-${testId}`}
      href={href}
    >
      <span className="min-w-0 truncate">
        {label}
        {active ? <span className="sr-only"> (selected)</span> : null}
      </span>
      {toggle ? <Switch on={active} size="lg" /> : null}
    </Link>
  );
}

function FilterGroupView({ group }: { group: FacetGroup }) {
  const visible = visibleOptions(group);
  if (visible.length === 0) {
    return null;
  }

  const shown = visible.slice(0, GROUP_PREVIEW);
  const more = visible.slice(GROUP_PREVIEW);
  const list = "flex flex-wrap gap-2";

  return (
    <fieldset className="border-line min-w-0 border-t px-5 py-4">
      <legend
        className={cn(
          "float-left mb-2.5 w-full text-[15px] font-semibold",
          group.toggle && "sr-only"
        )}
      >
        {group.title}
      </legend>
      <div className={cn("clear-left", list)}>
        {shown.map((option) => (
          <FilterLink {...option} key={option.testId} toggle={group.toggle} />
        ))}
      </div>
      {more.length > 0 ? (
        <details
          className="group mt-2"
          open={more.some((option) => option.active)}
        >
          <summary
            className={cn(
              "text-muted-foreground hover:text-foreground w-fit cursor-pointer list-none rounded-[6px] text-[13px] [&::-webkit-details-marker]:hidden",
              ROW_FOCUS
            )}
          >
            <span className="group-open:hidden">Show more</span>
            <span className="hidden group-open:inline">Show less</span>
          </summary>
          <div className={cn("mt-2", list)}>
            {more.map((option) => (
              <FilterLink
                {...option}
                key={option.testId}
                toggle={group.toggle}
              />
            ))}
          </div>
        </details>
      ) : null}
    </fieldset>
  );
}

function resultsLabel(total: number): string {
  return total === 1 ? "Show 1 job" : `Show ${total} jobs`;
}

// The phone filter sheet: a native popover styled as a bottom sheet, opened
// by the toolbar's filter chips, so it needs no client JS. From lg up the
// toolbar chips do this job and the sheet stays hidden.
export function BoardFilters({
  facets,
  marketing,
  options,
  query,
  total,
}: {
  facets: BoardFacets;
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
  total?: number;
}) {
  const groups = buildFilterGroups({ facets, marketing, options, query });
  const hasFilters = boardQueryHasFilters(query);

  return (
    <aside
      aria-label="Filters"
      className="bg-card text-foreground fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl border-0 p-0 shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_-16px_48px_rgb(0_0_0/0.16)] backdrop:bg-black/30 lg:hidden"
      id={FILTERS_SHEET_ID}
      popover="auto"
    >
      <div className="bg-card sticky top-0 z-10">
        <div className="flex justify-center pt-2">
          <span className="bg-line-strong h-[5px] w-9 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2.5 pb-3.5">
          {hasFilters ? (
            <Link
              className={cn("text-muted-foreground text-[15px]", ROW_FOCUS)}
              href={boardStateHref(
                clearBoardFilters(query),
                options,
                marketing
              )}
            >
              Reset
            </Link>
          ) : (
            <span className="text-subtle text-[15px]">Reset</span>
          )}
          <h2 className="text-[17px] leading-[22px] font-semibold">Filters</h2>
          <button
            className={cn("text-[15px] font-medium", ROW_FOCUS)}
            popoverTarget={FILTERS_SHEET_ID}
            popoverTargetAction="hide"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
      <div>
        {groups.map((group) => (
          <FilterGroupView group={group} key={group.id} />
        ))}
      </div>
      {total === undefined ? null : (
        <div className="bg-card border-line sticky bottom-0 border-t px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            className={cn(
              "bg-primary text-primary-foreground flex h-12 w-full items-center justify-center rounded-[12px] text-[16px] font-medium",
              ROW_FOCUS
            )}
            popoverTarget={FILTERS_SHEET_ID}
            popoverTargetAction="hide"
            type="button"
          >
            {resultsLabel(total)}
          </button>
        </div>
      )}
    </aside>
  );
}

const CHIP =
  "flex h-7 shrink-0 items-center gap-1.5 rounded-[8px] bg-card px-2 text-[13px] leading-[18px] ring-1 ring-line-strong ring-inset";
const PHONE_CHIP =
  "flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[14px] leading-[18px] ring-1 ring-line-strong ring-inset";

function Caret() {
  return (
    <span aria-hidden="true" className="text-subtle text-[10px] leading-3">
      ▾
    </span>
  );
}

// What the popover footer needs: the current list URL and its size.
export interface ChipMenuFooter {
  currentHref: string;
  total: number;
}

function showLabel(total: number): string {
  return total === 1 ? "Show 1 job" : `Show ${total} jobs`;
}

// Desktop: a chip that drops down the group's options. <details> keeps it
// usable without JS; every option is a crawlable link. The scrim sits inside
// the summary, so a click on it closes the menu. The details stays static so
// the scrim spans the toolbar (the positioned ancestor) and everything below.
function ChipMenu({
  footer,
  group,
}: {
  footer?: ChipMenuFooter;
  group: FacetGroup;
}) {
  const visible = visibleOptions(group);
  const active = visible.filter((option) => option.active);

  return (
    <MenuDetails className="group hidden lg:block">
      <summary
        className={cn(
          CHIP,
          "group-open:ring-subtle cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          ROW_FOCUS
        )}
        data-testid={`filter-chip-${group.id}`}
      >
        <span className="text-muted-foreground">{group.chip}</span>
        {active.length > 0 ? (
          <span className="text-foreground max-w-40 truncate font-medium">
            {active.map((option) => option.label).join(", ")}
          </span>
        ) : null}
        <Caret />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-full z-20 hidden h-screen cursor-default bg-black/25 group-open:block dark:bg-black/55"
        />
      </summary>
      <div className="relative h-0">
        <div className="bg-popover text-popover-foreground ring-line absolute top-0 left-0 z-30 mt-4 flex w-[300px] flex-col gap-3 rounded-[12px] p-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_32px_64px_-16px_rgb(0_0_0/0.25)] ring-1 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_32px_64px_-16px_rgb(0_0_0/0.75)]">
          <p className="text-foreground text-[13px] leading-[18px] font-medium">
            {group.title}
          </p>
          <ul className="border-line flex max-h-80 flex-col gap-0.5 overflow-y-auto border-t pt-2">
            {visible.map((option) => (
              <li key={option.testId}>
                <Link
                  aria-current={option.active ? "true" : undefined}
                  className={cn(
                    "text-foreground flex h-8 items-center gap-2.5 rounded-[6px] px-2 text-[13px] leading-[18px] whitespace-nowrap",
                    option.active ? "bg-tag" : "hover:bg-tag",
                    ROW_FOCUS
                  )}
                  data-active={option.active ? "true" : undefined}
                  data-testid={option.testId}
                  href={option.href}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[5px] text-[10px] leading-[10px]",
                      option.active
                        ? "bg-foreground text-background"
                        : "ring-line-strong ring-1 ring-inset"
                    )}
                  >
                    {option.active ? "✓" : null}
                  </span>
                  <span className="min-w-0 grow truncate">
                    {option.label}
                    {option.active ? (
                      <span className="sr-only"> (selected)</span>
                    ) : null}
                  </span>
                  <span
                    className="text-subtle shrink-0 text-[12px] leading-4 tabular-nums"
                    data-count={option.count}
                    data-testid="facet-count"
                  >
                    {option.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {footer ? (
            <div className="flex items-center gap-1.5">
              <div className="flex grow">
                {active.length > 0 ? (
                  <Link
                    className={cn(
                      "text-subtle hover:text-foreground rounded-sm py-[5px] text-[13px] leading-[18px]",
                      ROW_FOCUS
                    )}
                    href={group.clearHref}
                  >
                    Reset
                  </Link>
                ) : null}
              </div>
              <Link
                className={cn(
                  "bg-primary text-primary-foreground hover:bg-primary/90 flex h-7 shrink-0 items-center rounded-[8px] px-2.5 text-[13px] leading-[18px] font-medium",
                  ROW_FOCUS
                )}
                href={footer.currentHref}
              >
                {showLabel(footer.total)}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </MenuDetails>
  );
}

function ToggleChip({ group }: { group: FacetGroup }) {
  const [option] = group.options;
  if (option === undefined) {
    return null;
  }

  return (
    <Link
      aria-current={option.active ? "true" : undefined}
      className={cn(CHIP, "hidden gap-2 lg:flex", ROW_FOCUS)}
      data-active={option.active ? "true" : undefined}
      data-testid={option.testId}
      href={option.href}
    >
      <span
        className={
          option.active
            ? "text-foreground font-medium"
            : "text-muted-foreground"
        }
      >
        {group.chip}
      </span>
      <Switch on={option.active} size="sm" />
    </Link>
  );
}

// Phone: an active group is a removable chip; an inactive one opens the sheet.
function PhoneChip({ group }: { group: FacetGroup }) {
  const active = visibleOptions(group).filter((option) => option.active);
  if (active.length > 0) {
    const value = group.toggle
      ? group.chip
      : active.map((option) => option.label).join(", ");
    return (
      <Link
        aria-label={`Remove ${group.chip} filter: ${value}`}
        className={cn(
          PHONE_CHIP,
          "bg-card text-foreground pr-2.5 font-medium lg:hidden",
          ROW_FOCUS
        )}
        href={group.clearHref}
      >
        <span className="max-w-40 truncate">{value}</span>
        <X aria-hidden="true" className="text-subtle size-3" />
      </Link>
    );
  }

  return (
    <button
      className={cn(PHONE_CHIP, "text-muted-foreground lg:hidden", ROW_FOCUS)}
      popoverTarget={FILTERS_SHEET_ID}
      popoverTargetAction="show"
      type="button"
    >
      {group.chip}
    </button>
  );
}

// The chip row in the toolbar. Groups with nothing to pick are left out.
export function FilterChips({
  footer,
  groups,
}: {
  footer?: ChipMenuFooter;
  groups: FacetGroup[];
}) {
  const shown = groups.filter((group) => visibleOptions(group).length > 0);
  const isActive = (group: FacetGroup) =>
    group.options.some((option) => option.active);
  // Phone chips lead with what is already applied.
  const phoneOrder = [
    ...shown.filter(isActive),
    ...shown.filter((group) => !isActive(group)),
  ];
  const activeCount = groups.reduce(
    (sum, group) =>
      sum + group.options.filter((option) => option.active).length,
    0
  );

  return (
    <>
      <button
        aria-label={
          activeCount > 0 ? `Filters (${activeCount} active)` : "Filters"
        }
        className={cn(
          PHONE_CHIP,
          "bg-card text-foreground w-[34px] justify-center px-0 lg:hidden",
          ROW_FOCUS
        )}
        popoverTarget={FILTERS_SHEET_ID}
        popoverTargetAction="show"
        type="button"
      >
        <ListFilter aria-hidden="true" className="size-4" />
      </button>
      {phoneOrder.map((group) => (
        <PhoneChip group={group} key={`phone-${group.id}`} />
      ))}
      {shown.map((group) =>
        group.toggle ? (
          <ToggleChip group={group} key={group.id} />
        ) : (
          <ChipMenu footer={footer} group={group} key={group.id} />
        )
      )}
    </>
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
