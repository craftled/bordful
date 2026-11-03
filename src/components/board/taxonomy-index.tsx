import Link from "next/link";

import { Crumbs, PageFrame, PageTitle } from "@/components/board/taxonomy-hub";
import {
  TAXONOMY_INDEX_LABEL,
  TaxonomyTabs,
} from "@/components/board/taxonomy-tabs";
import type { TaxonomyKind } from "@/lib/board/paths";
import { loadBoardPool } from "@/lib/board/pool";
import {
  countTaxonomy,
  filterByTaxonomy,
  type TaxonomyFacet,
} from "@/lib/board/taxonomy";
import type { JobEmploymentType } from "@/lib/domain/job-vocab";
import { getSiteSettings } from "@/lib/read";
import {
  countWorkplaces,
  formatMedianUsd,
  medianSalaryUsd,
  rolesWithTaxonomy,
  TYPE_DESCRIPTION,
} from "@/lib/read/taxonomy-stats";
import { cn } from "@/lib/utils";

const POPULAR_COUNT = 4;

const HEADING: Record<TaxonomyKind, string> = {
  language: "Jobs by language",
  level: "Jobs by level",
  location: "Jobs by location",
  type: "Jobs by type",
};

const NOUN: Record<TaxonomyKind, [string, string]> = {
  language: ["language", "languages"],
  level: ["level", "levels"],
  location: ["place", "places"],
  type: ["contract type", "contract types"],
};

const POPULAR_LABEL: Record<TaxonomyKind, string> = {
  language: "Popular",
  level: "Popular",
  location: "Popular",
  type: "Contract types",
};

const REST_LABEL: Record<TaxonomyKind, string> = {
  language: "All languages",
  level: "All levels",
  location: "All locations",
  type: "Other types",
};

// Paper shortens the body on phones so it stays on one line.
const ANY_MIX = {
  body: "Create an alert for any mix of type, level, language and place.",
  phoneBody: "Create an alert for any mix of filters.",
  title: "Want these in your inbox?",
};

const ALERT_COPY: Record<
  TaxonomyKind,
  { body: string; phoneBody: string; title: string }
> = {
  language: ANY_MIX,
  level: ANY_MIX,
  location: {
    body: "Create an alert and we email new roles for any place you pick.",
    phoneBody: "Create an alert for any place you pick.",
    title: "Not seeing your place?",
  },
  type: ANY_MIX,
};

const SECTION_LABEL =
  "text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase";

function subtitle(kind: TaxonomyKind, roles: number, groups: number): string {
  const [one, many] = NOUN[kind];
  const roleWord = roles === 1 ? "open role" : "open roles";
  return `${roles} ${roleWord} in ${groups} ${groups === 1 ? one : many}.`;
}

function PopularCard({
  compact,
  detail,
  facet,
  inlineDetail,
}: {
  compact: boolean;
  detail: string | null;
  facet: TaxonomyFacet;
  // When only some cards in the row have a median, it rides on the count
  // line so no card carries an empty bottom row.
  inlineDetail: boolean;
}) {
  const count = `${facet.count} ${facet.count === 1 ? "role" : "roles"}`;
  return (
    <Link
      className="bg-card ring-line hover:ring-line-strong flex h-full flex-col gap-1 rounded-[14px] p-4 ring-1 transition-shadow md:gap-[6px] md:p-5"
      data-testid="taxonomy-link"
      href={facet.href}
    >
      <span className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-foreground text-[16px] leading-5 font-medium md:text-[18px]",
            compact ? "md:leading-[22px]" : "md:leading-6"
          )}
        >
          {facet.label}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "text-subtle hidden text-[15px] md:block",
            compact ? "leading-[18px]" : "leading-[22px]"
          )}
        >
          →
        </span>
      </span>
      <span
        className={cn(
          "text-muted-foreground text-[13px] leading-4 md:text-[14px]",
          compact ? "md:leading-[18px]" : "md:leading-5"
        )}
      >
        {count}
        {inlineDetail && detail ? (
          <span className="text-subtle"> · {detail}</span>
        ) : null}
      </span>
      {!inlineDetail && detail ? (
        <span
          className={cn(
            "text-subtle text-[12px] leading-4 md:text-[13px]",
            compact ? null : "md:leading-[19px]"
          )}
        >
          {detail}
        </span>
      ) : null}
    </Link>
  );
}

export async function TaxonomyIndex({ kind }: { kind: TaxonomyKind }) {
  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const facets = countTaxonomy(cards)[
    kind === "location"
      ? "locations"
      : (`${kind}s` as "languages" | "levels" | "types")
  ].filter((facet) => facet.count > 0);
  const popular = facets.slice(0, POPULAR_COUNT).map((facet) => ({
    detail:
      kind === "type"
        ? (TYPE_DESCRIPTION[facet.slug as JobEmploymentType] ?? null)
        : formatMedianUsd(
            medianSalaryUsd(filterByTaxonomy(cards, kind, facet.slug) ?? [])
          ),
    facet,
  }));
  const inlineDetail = popular.some((card) => card.detail === null);
  const rest = facets.slice(POPULAR_COUNT);
  const workplaces = kind === "type" ? countWorkplaces(cards) : [];
  const alert = ALERT_COPY[kind];
  // Paper's locations index keeps the roomier lines; the type, level and
  // language indexes (three artboards to one) are tighter.
  const compact = kind !== "location";
  const rowClass = cn(
    "border-line flex items-center justify-between border-b py-3 text-[15px] leading-[18px] md:py-[10px] md:text-[14px]",
    compact ? null : "md:leading-5"
  );

  return (
    <PageFrame testId="taxonomy-hub">
      <Crumbs
        compact={compact}
        items={[
          { href: "/jobs", label: "Jobs" },
          { label: TAXONOMY_INDEX_LABEL[kind] },
        ]}
      />
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-4">
        <PageTitle
          subtitle={subtitle(
            kind,
            rolesWithTaxonomy(cards, kind),
            facets.length
          )}
          tight={kind === "location"}
        >
          {HEADING[kind]}
        </PageTitle>
        <TaxonomyTabs active={kind} compact={compact} />
      </div>
      {facets.length === 0 ? (
        <p className="text-muted-foreground">No open roles to group yet.</p>
      ) : null}
      {popular.length > 0 ? (
        <section
          aria-labelledby="taxonomy-popular"
          className="flex flex-col gap-[14px]"
        >
          <h2
            className={`${SECTION_LABEL} sr-only md:not-sr-only`}
            id="taxonomy-popular"
          >
            {POPULAR_LABEL[kind]}
          </h2>
          <ul className="grid max-w-[1064px] grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {popular.map((card) => (
              <li key={card.facet.slug}>
                <PopularCard
                  compact={compact}
                  detail={card.detail}
                  facet={card.facet}
                  inlineDetail={inlineDetail}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {rest.length > 0 ? (
        <section
          aria-labelledby="taxonomy-rest"
          className="flex flex-col gap-[2px] md:gap-[6px]"
        >
          <h2 className={SECTION_LABEL} id="taxonomy-rest">
            {REST_LABEL[kind]}
          </h2>
          <ul className="grid gap-x-8 md:grid-cols-3">
            {rest.map((facet) => (
              <li key={facet.slug}>
                <Link
                  className={cn(rowClass, "hover:bg-selected/50")}
                  data-testid="taxonomy-link"
                  href={facet.href}
                >
                  <span className="text-foreground">{facet.label}</span>
                  <span className="text-subtle">{facet.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {workplaces.length > 0 ? (
        <section
          aria-labelledby="taxonomy-workplace"
          className="flex flex-col gap-[2px] md:gap-[6px]"
        >
          <h2 className={SECTION_LABEL} id="taxonomy-workplace">
            By workplace
          </h2>
          <ul className="grid gap-x-8 md:grid-cols-3">
            {workplaces.map((row) => (
              <li className={rowClass} key={row.type}>
                {row.type === "remote" ? (
                  <Link
                    className="text-foreground hover:underline"
                    href="/jobs/location/remote"
                  >
                    {row.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{row.label}</span>
                )}
                <span className="text-subtle">{row.count}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {settings.alerts.enabled ? (
        <aside className="bg-card ring-line flex flex-col gap-[10px] rounded-[14px] p-[18px] ring-1 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex flex-col gap-[10px] md:gap-[2px]">
            <p
              className={cn(
                "text-foreground text-[15px] leading-[18px] font-medium md:text-[16px]",
                compact ? "md:leading-5" : "md:leading-[23px]"
              )}
            >
              {alert.title}
            </p>
            <p
              className={cn(
                "text-muted-foreground text-[13px] leading-4 md:text-[14px]",
                compact ? "md:leading-[18px]" : "md:leading-5"
              )}
            >
              <span className="md:hidden">{alert.phoneBody}</span>
              <span className="max-md:hidden">{alert.body}</span>
            </p>
          </div>
          <Link
            className="bg-primary text-primary-foreground inline-flex h-9 w-fit shrink-0 items-center justify-center self-start rounded-md px-[14px] text-[14px] font-medium md:self-auto"
            href="/alerts"
          >
            Create alert
          </Link>
        </aside>
      ) : null}
    </PageFrame>
  );
}
