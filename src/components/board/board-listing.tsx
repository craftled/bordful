import Link from "next/link";

import {
  BoardFilters,
  buildFilterGroups,
} from "@/components/board/board-filters";
import { BoardHero, heroStats } from "@/components/board/board-hero";
import { BoardList } from "@/components/board/board-list";
import { BoardPagination } from "@/components/board/board-pagination";
import { BoardRail } from "@/components/board/board-rail";
import { BoardToolbar } from "@/components/board/board-toolbar";
import { BoardWorkspace } from "@/components/board/board-workspace";
import { PostJobCard } from "@/components/board/post-job-card";
import { HINT_CLASS } from "@/components/board/rail-styles";
import { filterBoard, usdBounds } from "@/lib/board/filter";
import { boardStateHref } from "@/lib/board/links";
import type { TaxonomyKind } from "@/lib/board/paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  boardQueryHasFilters,
  clearBoardFilters,
} from "@/lib/board/query";
import { buildBoardView } from "@/lib/board/view";
import type { JobListItem } from "@/lib/read/types";
import { cn } from "@/lib/utils";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export interface ListStats {
  medianSalaryUsd: number | null;
  postedThisWeek: number;
  remote: number;
  total: number;
}

// Figures for the "In this list" card, from the filtered jobs only.
export function listStats(
  cards: readonly JobListItem[],
  now: number
): ListStats {
  const mids: number[] = [];
  let remote = 0;
  let postedThisWeek = 0;

  for (const card of cards) {
    const bounds = usdBounds(card);
    if (bounds !== null) {
      mids.push((bounds[0] + bounds[1]) / 2);
    }
    if (card.workplaceType === "remote") {
      remote += 1;
    }
    const posted = card.publishedAt ? Date.parse(card.publishedAt) : Number.NaN;
    if (
      !Number.isNaN(posted) &&
      now - posted >= 0 &&
      now - posted <= MS_PER_WEEK
    ) {
      postedThisWeek += 1;
    }
  }

  mids.sort((left, right) => left - right);
  const middle = Math.floor(mids.length / 2);
  let medianSalaryUsd: number | null = null;
  if (mids.length > 0) {
    medianSalaryUsd =
      mids.length % 2 === 1
        ? (mids[middle] ?? null)
        : ((mids[middle - 1] ?? 0) + (mids[middle] ?? 0)) / 2;
  }

  return { medianSalaryUsd, postedThisWeek, remote, total: cards.length };
}

function formatUsdK(value: number): string {
  return `$${Math.round(value / 1000)}k`;
}

// Carries the board filters over to the alert sign-up form.
export function alertsHref(query: BoardQuery): string {
  const params = new URLSearchParams();
  if (query.types.length > 0) {
    params.set("types", query.types.join(","));
  }
  if (query.seniority.length > 0) {
    params.set("seniority", query.seniority.join(","));
  }
  if (query.salary.length > 0) {
    params.set("salary", query.salary.join(","));
  }
  if (query.languages.length > 0) {
    params.set("languages", query.languages.join(","));
  }
  if (query.remote) {
    params.set("remote", "true");
  }
  if (query.visa) {
    params.set("visa", "true");
  }
  const qs = params.toString();
  return qs.length > 0 ? `/alerts?${qs}` : "/alerts";
}

const CARD = "bg-card ring-line rounded-[14px] shadow-xs ring-1";
const PRIMARY_BUTTON =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-7 shrink-0 items-center rounded-[8px] px-2.5 text-[13px] font-medium";

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px] leading-[18px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium tabular-nums">{value}</dd>
    </div>
  );
}

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: "J K", label: "Move through roles" },
  { keys: "↵", label: "Open the selected role" },
  { keys: "S", label: "Save for later" },
];

// Shown in the right column until a row is opened in the preview.
export function PickRoleCard() {
  return (
    <section
      aria-labelledby="board-pick-title"
      className="bg-card ring-line flex flex-col gap-3.5 rounded-[14px] p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_28px_56px_-20px_rgb(0_0_0/0.16)] ring-1"
    >
      <h2
        className="text-foreground text-[16px] leading-[22px] font-medium"
        id="board-pick-title"
      >
        Pick a role to see the details
      </h2>
      <p className="text-muted-foreground text-[13px] leading-5">
        Salary, level and location open here, next to the list, so you can
        compare without losing your place.
      </p>
      <ul className="flex flex-col gap-2 pt-1">
        {SHORTCUTS.map((shortcut) => (
          <li className="flex items-center gap-2.5" key={shortcut.keys}>
            <kbd
              className={cn(
                HINT_CLASS,
                "h-5 min-w-[22px] justify-center font-sans leading-5"
              )}
            >
              {shortcut.keys}
            </kbd>
            <span className="text-muted-foreground text-[13px] leading-[18px]">
              {shortcut.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OverviewPanel({
  alerts,
  filterSummary,
  pickRole,
  postJob,
  stats,
}: {
  alerts: string | null;
  filterSummary: string;
  pickRole: boolean;
  postJob: { durationDays: number; priceLabel: string } | null;
  stats: ListStats;
}) {
  return (
    <div className="hidden flex-col gap-4 py-2 pr-2 xl:flex">
      {pickRole ? <PickRoleCard /> : null}
      {alerts ? (
        <section
          aria-labelledby="board-alert-title"
          className={cn(CARD, "flex flex-col gap-2.5 p-4")}
        >
          <h2
            className="text-[13px] leading-[18px] font-medium"
            id="board-alert-title"
          >
            {filterSummary ? "This search, by email" : "New jobs, by email"}
          </h2>
          <p className="text-muted-foreground text-[12px] leading-[17px]">
            {filterSummary ? `${filterSummary} · ` : ""}
            {stats.total === 1 ? "1 role" : `${stats.total} roles`}. Get new
            matches in your inbox.
          </p>
          <div className="flex">
            <Link className={PRIMARY_BUTTON} href={alerts}>
              Create alert
            </Link>
          </div>
        </section>
      ) : null}
      {stats.total > 0 ? (
        <section
          aria-labelledby="board-stats-title"
          className="ring-line flex flex-col gap-2 rounded-[14px] p-4 ring-1 ring-inset"
        >
          <h2
            className="text-subtle text-[12px] leading-4 font-medium"
            id="board-stats-title"
          >
            In this list
          </h2>
          <dl className="flex flex-col gap-2">
            {stats.medianSalaryUsd === null ? null : (
              <StatRow
                label="Median salary"
                value={formatUsdK(stats.medianSalaryUsd)}
              />
            )}
            <StatRow
              label="Remote"
              value={`${stats.remote} of ${stats.total}`}
            />
            <StatRow
              label="Posted this week"
              value={String(stats.postedThisWeek)}
            />
          </dl>
        </section>
      ) : null}
      {postJob ? (
        <PostJobCard
          durationDays={postJob.durationDays}
          priceLabel={postJob.priceLabel}
        />
      ) : null}
    </div>
  );
}

// The phone version of the alert card, slotted into the job list.
function InlineAlert({ href, summary }: { href: string; summary: string }) {
  return (
    <li className="lg:hidden">
      <div
        className={cn(
          CARD,
          "my-1.5 flex items-center justify-between gap-3 rounded-xl px-3.5 py-3"
        )}
      >
        <div className="min-w-0">
          <p className="text-[14px] leading-[18px] font-medium">
            Get these by email
          </p>
          {summary ? (
            <p className="text-muted-foreground truncate text-[12px] leading-4">
              {summary}
            </p>
          ) : null}
        </div>
        <Link
          className={cn(PRIMARY_BUTTON, "h-[30px] rounded-full px-3")}
          href={href}
        >
          Create alert
        </Link>
      </div>
    </li>
  );
}

export function BoardListing({
  alertsEnabled = false,
  archiveKind,
  archiveValue,
  cards,
  heading,
  headingLevel = "h1",
  headingTestId,
  intro,
  layout = "contained",
  listingTitle,
  marketing,
  options,
  postJob = null,
  query,
  showControls = true,
  showFilters = true,
  showHeading = true,
}: {
  alertsEnabled?: boolean;
  archiveKind?: TaxonomyKind;
  archiveValue?: string;
  cards: JobListItem[];
  heading?: string;
  headingLevel?: "h1" | "h2";
  headingTestId?: string;
  intro?: string;
  // "app" is the full-bleed board (filter bar, rail, list, overview panel).
  // "contained" fits inside a page column, as on taxonomy archives.
  layout?: "app" | "contained";
  listingTitle?: string;
  marketing: boolean;
  options: BoardQueryOptions;
  postJob?: { durationDays: number; priceLabel: string } | null;
  query: BoardQuery;
  showControls?: boolean;
  showFilters?: boolean;
  showHeading?: boolean;
}) {
  const now = Date.now();
  const view = buildBoardView(cards, query, now);
  const app = layout === "app";
  const updated = heroStats(cards, now).lastUpdated;
  const groups = buildFilterGroups({
    facets: view.facets,
    marketing,
    options,
    query,
  });
  const filterSummary = groups
    .map((group) => {
      const active = group.options.filter((option) => option.active);
      if (active.length === 0) {
        return "";
      }
      return group.toggle
        ? group.chip
        : active.map((option) => option.label).join(", ");
    })
    .filter((part) => part.length > 0)
    .join(" · ");
  const alerts = alertsEnabled ? alertsHref(query) : null;

  const searchName = [query.q ? `“${query.q}”` : "", filterSummary]
    .filter((part) => part.length > 0)
    .join(" · ");

  // The phone filter sheet sits with the rail; it is a popover, so it takes
  // no room in the layout.
  const rail = showFilters ? (
    <div className="border-line lg:border-r">
      <BoardRail marketing={marketing} options={options} query={query} />
      <BoardFilters
        facets={view.facets}
        marketing={marketing}
        options={options}
        query={query}
        total={view.matchCount}
      />
    </div>
  ) : null;

  const list = (
    <div className="min-w-0 p-2">
      {showHeading ? (
        // The app board shows no list header in Paper; the heading stays
        // for screen readers and search engines.
        <div className={cn(app && "sr-only")}>
          <BoardHero
            heading={headingLevel}
            intro={intro}
            testId={headingTestId}
            title={heading}
          />
        </div>
      ) : null}
      {view.docs.length > 0 ? (
        <BoardList
          insert={
            alerts ? (
              <InlineAlert href={alerts} summary={filterSummary} />
            ) : undefined
          }
          jobs={view.docs}
          now={now}
        />
      ) : (
        <div
          className="bg-card ring-line m-2 flex flex-col items-center gap-2 rounded-[14px] px-6 py-10 text-center ring-1"
          data-testid="board-empty-box"
        >
          <p className="text-[14px] font-medium" data-testid="board-empty">
            No matching jobs
          </p>
          {boardQueryHasFilters(query) ? (
            <Link
              className="text-muted-foreground hover:text-foreground text-[13px] underline underline-offset-4"
              data-testid="board-empty-clear"
              href={boardStateHref(
                clearBoardFilters(query),
                options,
                marketing
              )}
            >
              Clear filters
            </Link>
          ) : null}
        </div>
      )}
      <BoardPagination
        archiveKind={archiveKind}
        archiveValue={archiveValue}
        marketing={marketing}
        options={options}
        page={view.page}
        query={query}
        totalPages={view.totalPages}
      />
    </div>
  );

  return (
    <div
      className={cn("flex flex-col", app && "min-h-[calc(100dvh-3.25rem)]")}
      data-board-layout={layout}
    >
      <BoardToolbar
        className={cn(app && (showFilters ? "lg:pl-[232px]" : "lg:pl-4"))}
        facets={showFilters ? view.facets : undefined}
        marketing={marketing}
        options={options}
        query={query}
        saveSearch={
          showControls
            ? {
                href: boardStateHref({ ...query, page: 1 }, options, marketing),
                name: searchName,
              }
            : null
        }
        showControls={showControls}
        title={listingTitle}
        total={view.matchCount}
        updated={updated}
      />
      <BoardWorkspace
        alertsEnabled={alertsEnabled}
        aside={
          app ? (
            <OverviewPanel
              alerts={alerts}
              filterSummary={filterSummary}
              pickRole={view.docs.length > 0}
              postJob={postJob}
              stats={listStats(filterBoard(cards, query), now)}
            />
          ) : undefined
        }
        className={cn(
          "flex-1 lg:grid",
          showFilters
            ? "lg:grid-cols-[216px_minmax(0,1fr)]"
            : "lg:grid-cols-[minmax(0,1fr)]",
          app &&
            (showFilters
              ? "xl:grid-cols-[216px_minmax(0,1fr)_400px]"
              : "xl:grid-cols-[minmax(0,1fr)_400px]")
        )}
        jobs={view.docs}
        list={list}
        now={now}
        offset={(view.page - 1) * query.perPage}
        openClassName={
          showFilters
            ? "xl:grid-cols-[216px_520px_minmax(0,1fr)]"
            : "xl:grid-cols-[520px_minmax(0,1fr)]"
        }
        preview={app}
        rail={rail}
        total={view.matchCount}
      />
    </div>
  );
}
