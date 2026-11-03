import Link from "next/link";
import type { ReactNode } from "react";

import { loadBoardPool } from "@/lib/board/pool";
import { countTaxonomy, type TaxonomyFacet } from "@/lib/board/taxonomy";
import { getSiteSettings } from "@/lib/read";

export interface Crumb {
  href?: string;
  label: string;
}

export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="text-subtle flex flex-wrap items-center gap-2 text-[13px] md:text-[14px]"
    >
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span className="flex items-center gap-2" key={item.label}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href && !last ? (
              <Link
                className="hover:text-foreground transition-colors"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={last ? "page" : undefined}
                className={last ? "text-foreground" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function PageTitle({
  children,
  subtitle,
  testId,
}: {
  children: ReactNode;
  subtitle?: ReactNode;
  testId?: string;
}) {
  return (
    <h1
      className="text-foreground text-[28px] leading-[34px] font-medium tracking-[-0.035em] md:text-[40px] md:leading-[44px]"
      data-testid={testId}
    >
      {children}
      {subtitle ? <span className="text-subtle block">{subtitle}</span> : null}
    </h1>
  );
}

const POPULAR_COUNT = 4;

// The footer links to these ids (/jobs#job-types and friends), keep them in sync.
function Group({
  facets,
  id,
  title,
}: {
  facets: TaxonomyFacet[];
  id: string;
  title: string;
}) {
  const shown = facets.filter((facet) => facet.count > 0);
  if (shown.length === 0) {
    return null;
  }
  const popular = shown.slice(0, POPULAR_COUNT);
  const rest = shown.slice(POPULAR_COUNT);

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-20 space-y-6"
      id={id}
    >
      <h2
        className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase md:text-[12px]"
        id={`${id}-heading`}
      >
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {popular.map((facet) => (
          <li key={facet.slug}>
            <Link
              className="bg-card ring-line hover:ring-line-strong flex h-full flex-col gap-1 rounded-[14px] p-4 ring-1 transition-shadow md:gap-[6px] md:p-5"
              data-testid="taxonomy-link"
              href={facet.href}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-foreground text-[16px] leading-5 font-medium md:text-[18px] md:leading-6">
                  {facet.label}
                </span>
                <span
                  aria-hidden="true"
                  className="text-subtle hidden md:block"
                >
                  →
                </span>
              </span>
              <span className="text-muted-foreground text-[13px] md:text-[14px]">
                {facet.count} {facet.count === 1 ? "role" : "roles"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rest.length > 0 ? (
        <ul className="grid gap-x-8 md:grid-cols-3">
          {rest.map((facet) => (
            <li key={facet.slug}>
              <Link
                className="border-line hover:bg-selected/50 flex items-center justify-between border-b py-3 text-[15px] md:py-[10px] md:text-[14px]"
                data-testid="taxonomy-link"
                href={facet.href}
              >
                <span className="text-foreground">{facet.label}</span>
                <span className="text-subtle">{facet.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const JUMP_LINKS = [
  { href: "#job-types", label: "Type" },
  { href: "#levels", label: "Level" },
  { href: "#locations", label: "Location" },
  { href: "#languages", label: "Language" },
];

export async function TaxonomyHub() {
  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const counts = countTaxonomy(cards);

  return (
    <div className="space-y-8" data-testid="taxonomy-hub">
      <Crumbs items={[{ href: "/jobs", label: "Jobs" }, { label: "Browse" }]} />
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <PageTitle
          subtitle={
            settings.board.description ||
            "Open roles grouped by type, level, location, and language."
          }
        >
          {settings.board.title || "Browse jobs"}
        </PageTitle>
        <nav
          aria-label="Browse groups"
          className="md:bg-tag flex gap-[6px] overflow-x-auto md:gap-[2px] md:rounded-md md:p-[2px]"
        >
          {JUMP_LINKS.map((link) => (
            <a
              className="text-foreground bg-card ring-line-strong hover:text-foreground md:text-muted-foreground md:hover:bg-card shrink-0 rounded-full px-3 py-[6px] text-[13px] font-medium ring-1 md:rounded-sm md:bg-transparent md:px-3 md:py-1 md:font-normal md:ring-0"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="space-y-12">
        <Group facets={counts.types} id="job-types" title="Job types" />
        <Group facets={counts.levels} id="levels" title="Levels" />
        <Group facets={counts.locations} id="locations" title="Locations" />
        <Group facets={counts.languages} id="languages" title="Languages" />
      </div>
    </div>
  );
}
