import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BoardList } from "@/components/board/board-list";
import {
  alertsHref,
  type ListStats,
  listStats,
} from "@/components/board/board-listing";
import { BoardPagination } from "@/components/board/board-pagination";
import { MenuDetails } from "@/components/board/menu-details";
import { Crumbs, PageTitle } from "@/components/board/taxonomy-hub";
import {
  TAXONOMY_INDEX_LABEL,
  TAXONOMY_INDEX_PATH,
} from "@/components/board/taxonomy-tabs";
import { isMarketingEnabled } from "@/config/flags";
import { buildBoardFacets, filterBoard } from "@/lib/board/filter";
import { formatRelativePosted, SENIORITY_LABELS } from "@/lib/board/format";
import {
  buildTaxonomyArchivePath,
  slugifyTaxonomyValue,
} from "@/lib/board/paths";
import { loadBoardPool } from "@/lib/board/pool";
import {
  type BoardQuery,
  type BoardQueryOptions,
  type BoardSearchParams,
  parseBoardQuery,
  serializeBoardQuery,
  urlSearchParamsFromRecord,
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
import {
  type AlertFrequency,
  JOB_EMPLOYMENT_LABELS,
  type JobEmploymentType,
  type JobSeniority,
  type SalaryBandId,
} from "@/lib/domain/job-vocab";
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

// The job rows (JobRow's archive variant) sit inside one bordered card with
// hairline dividers. The divider sits on the row's article (border-box), so a
// 72px desktop row keeps its height with the hairline inside, as in Paper.
const LIST_CARD = cn(
  CARD,
  "overflow-clip",
  "[&_[data-testid=job-list]]:gap-0",
  "[&_[data-testid=job-row]:not(:last-child)>article]:border-line [&_[data-testid=job-row]:not(:last-child)>article]:border-b"
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

// The board search filters an archive can narrow by in place. The archive
// itself stays fixed; these ride along as the board's own search params
// (types, roles, remote, salary, visa) on the archive URL.
export interface ArchiveRefine {
  remote: boolean;
  salary: SalaryBandId[];
  seniority: JobSeniority[];
  types: JobEmploymentType[];
  visa: boolean;
}

const NO_REFINE: ArchiveRefine = {
  remote: false,
  salary: [],
  seniority: [],
  types: [],
  visa: false,
};

// Which picker an archive offers: a type archive narrows by level, a level
// or place archive by type (Paper's "Level: Any" / "Type: Any").
function pickerFor(kind: TaxonomyKind): "level" | "type" {
  return kind === "type" || kind === "language" ? "level" : "type";
}

export function parseArchiveRefine(
  kind: TaxonomyKind,
  slug: string,
  params: URLSearchParams,
  options: BoardQueryOptions
): ArchiveRefine {
  const query = parseBoardQuery(params, options);
  const picker = pickerFor(kind);
  return {
    remote: kind === "location" && slug === "remote" ? false : query.remote,
    salary: query.salary.slice(0, 1),
    seniority: picker === "level" ? query.seniority.slice(0, 1) : [],
    types: picker === "type" ? query.types.slice(0, 1) : [],
    visa: query.visa,
  };
}

function refineHref(
  path: string,
  refine: ArchiveRefine,
  options: BoardQueryOptions
): string {
  const search = archiveRefineSearch(refine, options);
  return search ? `${path}?${search}` : path;
}

export function archiveRefineSearch(
  refine: ArchiveRefine,
  options: BoardQueryOptions
): string {
  const base = parseBoardQuery(new URLSearchParams(""), options);
  return serializeBoardQuery(
    { ...base, ...refine, page: 1 },
    options
  ).toString();
}

const PILL_OFF =
  "bg-card text-foreground ring-line-strong hover:bg-surface-sub ring-1";
const PILL_ON = "bg-primary text-primary-foreground ring-primary ring-1";

interface PickerOption {
  count: number;
  href: string;
  label: string;
  selected: boolean;
}

// Paper's "Type: Any" chip. <details> keeps it working without JS; each
// option is a link to the archive with that one value.
function PickerPill({
  label,
  options,
  showAny = false,
  testId,
  value,
}: {
  label: string;
  options: PickerOption[];
  // Paper spells out "Type: Any" on desktop; the salary chip stays "Salary".
  showAny?: boolean;
  testId: string;
  value: string | null;
}) {
  return (
    <MenuDetails className="group relative">
      <summary
        className={cn(
          PILL,
          "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
          value ? PILL_ON : PILL_OFF
        )}
        data-testid={testId}
      >
        {label}
        {value ? `: ${value}` : null}
        {!value && showAny ? (
          <span className="max-md:hidden">: Any</span>
        ) : null}
      </summary>
      <ul className="bg-popover text-popover-foreground ring-line absolute top-full left-0 z-30 mt-1.5 flex min-w-44 flex-col gap-0.5 rounded-[12px] p-1.5 shadow-lg ring-1">
        {options.map((option) => (
          <li key={option.label}>
            <Link
              aria-current={option.selected ? "true" : undefined}
              className={cn(
                "text-foreground flex h-8 items-center justify-between gap-3 rounded-[6px] px-2 text-[13px] leading-[18px] whitespace-nowrap",
                option.selected ? "bg-tag" : "hover:bg-tag"
              )}
              href={option.href}
            >
              {option.label}
              <span className="text-subtle text-[12px] leading-4 tabular-nums">
                {option.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </MenuDetails>
  );
}

function FilterPills({
  cards,
  kind,
  options,
  path,
  refine,
  slug,
}: {
  cards: Parameters<typeof buildBoardFacets>[0];
  kind: TaxonomyKind;
  options: BoardQueryOptions;
  path: string;
  refine: ArchiveRefine;
  slug: string;
}) {
  const hrefFor = (next: ArchiveRefine) => refineHref(path, next, options);
  const facets = buildBoardFacets(cards);
  const picker = pickerFor(kind);

  const pickerOptions: PickerOption[] =
    picker === "type"
      ? facets.types.map((facet) => {
          const type = facet.value as JobEmploymentType;
          const selected = refine.types.includes(type);
          return {
            count: facet.count,
            href: hrefFor({ ...refine, types: selected ? [] : [type] }),
            label: JOB_EMPLOYMENT_LABELS[type] ?? facet.value,
            selected,
          };
        })
      : facets.seniority.map((facet) => {
          const level = facet.value as JobSeniority;
          const selected = refine.seniority.includes(level);
          return {
            count: facet.count,
            href: hrefFor({ ...refine, seniority: selected ? [] : [level] }),
            label: SENIORITY_LABELS[level] ?? facet.value,
            selected,
          };
        });
  const pickerValue =
    picker === "type"
      ? (refine.types.map((type) => JOB_EMPLOYMENT_LABELS[type])[0] ?? null)
      : (refine.seniority.map((level) => SENIORITY_LABELS[level])[0] ?? null);
  const pickerAny = {
    count: cards.length,
    href: hrefFor({ ...refine, seniority: [], types: [] }),
    label: "Any",
    selected: pickerValue === null,
  };

  const salaryOptions: PickerOption[] = facets.salary
    .filter((facet) => facet.count > 0)
    .map((facet) => {
      const band = facet.value as SalaryBandId;
      const selected = refine.salary.includes(band);
      return {
        count: facet.count,
        href: hrefFor({ ...refine, salary: selected ? [] : [band] }),
        label: band,
        selected,
      };
    });

  const showRemote = !(kind === "location" && slug === "remote");

  return (
    <nav aria-label="Narrow these jobs" className="flex flex-wrap gap-2">
      {pickerOptions.length > 0 || pickerValue ? (
        <PickerPill
          label={picker === "type" ? "Type" : "Level"}
          options={[pickerAny, ...pickerOptions]}
          showAny
          testId={`archive-pill-${picker}`}
          value={pickerValue}
        />
      ) : null}
      {showRemote ? (
        <Link
          aria-current={refine.remote ? "true" : undefined}
          className={cn(PILL, refine.remote ? PILL_ON : PILL_OFF)}
          data-testid="archive-pill-remote"
          href={hrefFor({ ...refine, remote: !refine.remote })}
        >
          Remote
        </Link>
      ) : null}
      {salaryOptions.length > 0 || refine.salary.length > 0 ? (
        <PickerPill
          label="Salary"
          options={[
            {
              count: cards.length,
              href: hrefFor({ ...refine, salary: [] }),
              label: "Any",
              selected: refine.salary.length === 0,
            },
            ...salaryOptions,
          ]}
          testId="archive-pill-salary"
          value={refine.salary[0] ?? null}
        />
      ) : null}
      {/* Paper's phone row stops at three chips. */}
      <Link
        aria-current={refine.visa ? "true" : undefined}
        className={cn(
          PILL,
          refine.visa ? PILL_ON : cn(PILL_OFF, "max-md:hidden")
        )}
        data-testid="archive-pill-visa"
        href={hrefFor({ ...refine, visa: !refine.visa })}
      >
        Visa sponsorship
      </Link>
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
  searchParams = {},
  value,
}: {
  kind: TaxonomyKind;
  page: number;
  searchParams?: BoardSearchParams;
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
  const slug = slugifyTaxonomyValue(value);
  const refine = parseArchiveRefine(
    kind,
    slug,
    urlSearchParamsFromRecord(searchParams),
    options
  );
  const refineSearch = archiveRefineSearch(refine, options);
  const searchQuery = taxonomySearchQuery(kind, value, page, options);
  // Archives the board search can express list what that search lists.
  const archiveCards = searchQuery ? filterBoard(cards, searchQuery) : filtered;
  const query = { ...(searchQuery ?? base), ...refine, page };
  const now = Date.now();
  const view = buildBoardView(archiveCards, query, now);
  if (view.outOfRange) {
    notFound();
  }
  const archivePath = buildTaxonomyArchivePath(kind, slug, 1);

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
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_324px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-5 lg:gap-4">
          <FilterPills
            cards={archiveCards}
            kind={kind}
            options={options}
            path={archivePath}
            refine={refine}
            slug={slug}
          />
          {view.docs.length > 0 ? (
            <div
              className={LIST_CARD}
              data-count={roles}
              data-testid="job-count"
            >
              <BoardList jobs={view.docs} now={now} variant="archive" />
            </div>
          ) : (
            <div
              className={cn(
                CARD,
                "text-muted-foreground px-4 py-10 text-center text-[13px] leading-[19px]"
              )}
              data-count={0}
              data-testid="job-count"
            >
              No {rolesLabel} roles match these filters.{" "}
              <Link
                className="text-foreground underline underline-offset-4"
                href={refineHref(archivePath, NO_REFINE, options)}
              >
                Show all
              </Link>
            </div>
          )}
          <BoardPagination
            archiveKind={kind}
            archiveSearch={refineSearch}
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
          className="flex flex-col gap-5 lg:gap-4"
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
