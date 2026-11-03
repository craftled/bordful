import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BoardList } from "@/components/board/board-list";
import {
  alertsHref,
  type ListStats,
  listStats,
} from "@/components/board/board-listing";
import { BoardPagination } from "@/components/board/board-pagination";
import { Crumbs, PageTitle } from "@/components/board/taxonomy-hub";
import {
  TAXONOMY_INDEX_LABEL,
  TAXONOMY_INDEX_PATH,
} from "@/components/board/taxonomy-tabs";
import { isMarketingEnabled } from "@/config/flags";
import { formatRelativePosted } from "@/lib/board/format";
import { boardStateHref } from "@/lib/board/links";
import {
  buildTaxonomyArchivePath,
  slugifyTaxonomyValue,
} from "@/lib/board/paths";
import { loadBoardPool } from "@/lib/board/pool";
import {
  type BoardQuery,
  type BoardQueryOptions,
  parseBoardQuery,
} from "@/lib/board/query";
import {
  filterByTaxonomy,
  SENIORITY_LEVEL,
  type TaxonomyKind,
  taxonomyLabel,
  taxonomySearchQuery,
  taxonomyTitle,
} from "@/lib/board/taxonomy";
import { buildBoardView } from "@/lib/board/view";
import type { AlertFrequency, JobSeniority } from "@/lib/domain/job-vocab";
import { getSiteSettings } from "@/lib/read";
import { type RelatedValue, relatedTaxonomy } from "@/lib/read/taxonomy-stats";
import { cn } from "@/lib/utils";

export function redirectTaxonomyAlias(
  kind: TaxonomyKind,
  value: string,
  page = 1
): void {
  if (slugifyTaxonomyValue(value) !== value) {
    permanentRedirect(buildTaxonomyArchivePath(kind, value, page));
  }
}

const RELATED_TITLE: Record<TaxonomyKind, string> = {
  language: "Other languages",
  level: "Nearby levels",
  location: "Other locations",
  type: "Other types",
};

const FREQUENCY_LABEL: Record<AlertFrequency, string> = {
  daily: "Sent once a day.",
  weekly: "Sent once a week.",
};

// Paper's archive cards: white surface, hairline ring, 14px corners.
const CARD = "bg-card ring-line rounded-[14px] ring-1";
const CARD_LABEL = "text-subtle text-[13px] leading-[19px]";
const PILL =
  "inline-flex h-[30px] shrink-0 items-center rounded-full px-3 text-[13px] leading-[19px] font-medium transition-colors";

// The job rows sit inside one bordered card with hairline dividers, so the
// board row's own rounded hover box is flattened to a full-width band.
const LIST_CARD = cn(
  CARD,
  "overflow-clip",
  "[&_[data-testid=job-list]]:gap-0",
  "[&_[data-testid=job-row]:not(:last-child)]:border-line [&_[data-testid=job-row]:not(:last-child)]:border-b",
  "[&_article]:hover:bg-surface-sub [&_article]:rounded-none [&_article]:px-4 [&_article]:py-3.5 [&_article]:hover:ring-0",
  "lg:[&_article]:h-[72px] lg:[&_article]:rounded-none lg:[&_article]:px-4 lg:[&_article]:py-0 lg:[&_h3]:text-[15px]"
);

// Levels and seniorities share names, so a level archive can prefill the
// alert form; locations other than remote have no alert filter.
function alertQuery(
  kind: TaxonomyKind,
  slug: string,
  searchQuery: BoardQuery | null,
  base: BoardQuery
): BoardQuery {
  if (searchQuery) {
    return searchQuery;
  }
  if (kind !== "level") {
    return base;
  }
  const label = taxonomyLabel("level", slug);
  const seniority = (
    Object.entries(SENIORITY_LEVEL) as [JobSeniority, string][]
  ).find(([, level]) => level === label)?.[0];
  return seniority ? { ...base, seniority: [seniority] } : base;
}

// Quick toggles from Paper. They open the board search with this archive's
// filter plus the toggle, so only archives the search can express get them.
function FilterPills({
  marketing,
  options,
  query,
}: {
  marketing: boolean;
  options: BoardQueryOptions;
  query: BoardQuery;
}) {
  const pills: { href: string; label: string; testId: string }[] = [];
  if (!query.remote) {
    pills.push({
      href: boardStateHref(
        { ...query, page: 1, remote: true },
        options,
        marketing
      ),
      label: "Remote",
      testId: "archive-pill-remote",
    });
  }
  if (!query.visa) {
    pills.push({
      href: boardStateHref(
        { ...query, page: 1, visa: true },
        options,
        marketing
      ),
      label: "Visa sponsorship",
      testId: "archive-pill-visa",
    });
  }
  if (pills.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Narrow these jobs" className="flex gap-2 overflow-x-auto">
      {pills.map((pill) => (
        <Link
          className={cn(
            PILL,
            "bg-card text-foreground ring-line-strong hover:bg-surface-sub ring-1"
          )}
          data-testid={pill.testId}
          href={pill.href}
          key={pill.testId}
        >
          {pill.label}
        </Link>
      ))}
    </nav>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px] leading-[19px]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function AlertCard({
  frequency,
  href,
  postedThisWeek,
  rolesLabel,
}: {
  frequency: AlertFrequency;
  href: string;
  postedThisWeek: number;
  rolesLabel: string;
}) {
  return (
    <section
      aria-labelledby="archive-alert-title"
      className={cn(CARD, "flex flex-col items-start gap-2.5 p-[18px]")}
    >
      <h2
        className="text-foreground text-[15px] leading-[22px] font-medium"
        id="archive-alert-title"
      >
        Get {rolesLabel} roles by email
      </h2>
      <p className="text-muted-foreground text-[13px] leading-[19px]">
        {postedThisWeek === 1
          ? "1 new role this week. "
          : `${postedThisWeek} new roles this week. `}
        {FREQUENCY_LABEL[frequency]}
      </p>
      <Link
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 items-center rounded-md px-3.5 text-[13px] leading-[19px] font-medium"
        href={href}
      >
        Create alert
      </Link>
    </section>
  );
}

function StatsCard({
  showRemote,
  stats,
  title,
}: {
  showRemote: boolean;
  stats: ListStats;
  title: string;
}) {
  return (
    <section
      aria-labelledby="archive-stats-title"
      className={cn(CARD, "flex flex-col gap-2.5 p-[18px]")}
      data-testid="archive-stats"
    >
      <h2 className={CARD_LABEL} id="archive-stats-title">
        {title}
      </h2>
      <dl className="flex flex-col gap-2.5">
        {stats.medianSalaryUsd === null ? null : (
          <StatRow
            label="Median salary"
            value={`$${Math.round(stats.medianSalaryUsd / 1000)}k`}
          />
        )}
        {showRemote ? (
          <StatRow
            label="Remote friendly"
            value={`${stats.remote} of ${stats.total}`}
          />
        ) : null}
        <StatRow
          label="Posted this week"
          value={String(stats.postedThisWeek)}
        />
      </dl>
    </section>
  );
}

function RelatedCard({
  items,
  title,
}: {
  items: RelatedValue[];
  title: string;
}) {
  return (
    <section
      aria-labelledby="archive-related-title"
      className={cn(CARD, "flex flex-col gap-2.5 p-[18px] max-lg:hidden")}
      data-testid="archive-related"
    >
      <h2 className={CARD_LABEL} id="archive-related-title">
        {title}
      </h2>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              className="group flex justify-between gap-3 text-[13px] leading-[19px]"
              href={item.href}
            >
              <span className="text-foreground group-hover:underline group-hover:underline-offset-4">
                {item.label}
              </span>
              <span className="text-subtle tabular-nums">{item.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function TaxonomyArchive({
  kind,
  page,
  value,
}: {
  kind: TaxonomyKind;
  page: number;
  value: string;
}) {
  redirectTaxonomyAlias(kind, value, page);

  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const filtered = filterByTaxonomy(cards, kind, value);
  if (!filtered || filtered.length === 0) {
    notFound();
  }

  const marketing = isMarketingEnabled();
  const options = { defaultPerPage: settings.board.jobsPerPage };
  const base = parseBoardQuery(new URLSearchParams(""), options);
  const searchQuery = taxonomySearchQuery(kind, value, page, options);
  const query = searchQuery ?? { ...base, page };
  const listingCards = searchQuery ? cards : filtered;
  const now = Date.now();
  const view = buildBoardView(listingCards, query, now);
  if (view.outOfRange) {
    notFound();
  }

  const slug = slugifyTaxonomyValue(value);
  const label = taxonomyLabel(kind, slug);
  const title = taxonomyTitle(kind, value);
  const roles = view.matchCount;
  const stats = listStats(filtered, now);
  const related = relatedTaxonomy(cards, kind, slug);
  const newest = filtered
    .map((card) => card.publishedAt)
    .filter((iso): iso is string => Boolean(iso))
    .sort()
    .at(-1);
  const updated = newest ? formatRelativePosted(newest, now) : "";
  // Levels and types read as common nouns ("senior roles"); places and
  // languages keep their capitals.
  const rolesLabel =
    kind === "level" || kind === "type" ? label.toLowerCase() : label;
  const statsTitle =
    kind === "location" && slug !== "remote" ? `In ${label}` : `${label} roles`;
  const alerts = settings.alerts.enabled
    ? alertsHref(alertQuery(kind, slug, searchQuery, base))
    : null;

  return (
    <div
      className="mx-auto flex w-full max-w-[1104px] flex-col gap-5 px-4 pt-2 pb-7 md:gap-8 md:pt-7 md:pb-[72px]"
      data-testid="taxonomy-archive"
    >
      <Crumbs
        items={[
          { href: "/jobs", label: "Jobs" },
          {
            href: TAXONOMY_INDEX_PATH[kind],
            label: TAXONOMY_INDEX_LABEL[kind],
          },
          { label },
        ]}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <PageTitle
          subtitle={`${roles} open ${roles === 1 ? "role" : "roles"}.`}
          testId="taxonomy-heading"
          tight
        >
          {title}
        </PageTitle>
        {updated ? (
          <p className="text-subtle hidden items-center gap-[6px] text-[13px] leading-[19px] md:flex">
            <span
              aria-hidden="true"
              className="bg-new size-[6px] rounded-full"
            />
            Updated {updated}
          </p>
        ) : null}
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_324px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          {searchQuery ? (
            <FilterPills
              marketing={marketing}
              options={options}
              query={searchQuery}
            />
          ) : null}
          <div className={LIST_CARD} data-count={roles} data-testid="job-count">
            <BoardList jobs={view.docs} now={now} />
          </div>
          <BoardPagination
            archiveKind={kind}
            archiveValue={value}
            marketing={marketing}
            options={options}
            page={view.page}
            query={query}
            totalPages={view.totalPages}
          />
        </div>
        <aside
          aria-label={`About ${title.toLowerCase()}`}
          className="flex flex-col gap-4"
        >
          {alerts ? (
            <AlertCard
              frequency={settings.alerts.defaultFrequency}
              href={alerts}
              postedThisWeek={stats.postedThisWeek}
              rolesLabel={rolesLabel}
            />
          ) : null}
          <StatsCard
            showRemote={!(kind === "location" && slug === "remote")}
            stats={stats}
            title={statsTitle}
          />
          {related.length > 0 ? (
            <RelatedCard items={related} title={RELATED_TITLE[kind]} />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
