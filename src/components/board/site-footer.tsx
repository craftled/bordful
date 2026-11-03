import { FooterView } from "@/components/board/footer-view";
import type { SocialProfiles } from "@/components/board/social-links";
import { TabBar } from "@/components/board/tab-bar";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath, type FooterColumn } from "@/config/nav";
import { companiesFromPool } from "@/lib/board/companies";
import { BOARD_POOL_LIMIT } from "@/lib/board/constants";
import { buildBoardFacets } from "@/lib/board/filter";
import { BOARD_SEARCH_PATH } from "@/lib/board/paths";
import { countTaxonomy, type TaxonomyFacet } from "@/lib/board/taxonomy";
import { getSiteSettings, listPublishedJobs } from "@/lib/read";

const FACET_LIMIT = 5;

// These columns are replaced by the facet columns and the RSS button.
const REPLACED_COLUMN_IDS = new Set(["feeds", "jobs"]);

// Paper's footer keeps Privacy and Terms under Company, not a sixth column.
function mergeLegal(columns: FooterColumn[]): FooterColumn[] {
  const legal = columns.find((column) => column.id === "legal");
  const company = columns.find((column) => column.id === "company");
  if (!(legal && company)) {
    return columns;
  }

  return columns
    .filter((column) => column.id !== "legal")
    .map((column) =>
      column.id === "company"
        ? { ...column, items: [...column.items, ...legal.items] }
        : column
    );
}

// "Jobs by category" links into the board search.
export function categoryColumn(
  items: Parameters<typeof buildBoardFacets>[0]
): FooterColumn | null {
  const categories = buildBoardFacets(items).categories.slice(0, FACET_LIMIT);
  if (categories.length === 0) {
    return null;
  }

  return {
    id: "category",
    items: categories.map((facet) => ({
      href: `${BOARD_SEARCH_PATH}?${new URLSearchParams({ categories: facet.value })}`,
      id: `category-${facet.value}`,
      label: facet.label ?? facet.value,
    })),
    title: "Jobs by category",
  };
}

function facetColumn(
  id: string,
  title: string,
  facets: readonly TaxonomyFacet[],
  label: (facet: TaxonomyFacet) => string
): FooterColumn | null {
  if (facets.length === 0) {
    return null;
  }

  return {
    id,
    items: facets.slice(0, FACET_LIMIT).map((facet) => ({
      href: facet.href,
      id: `${id}-${facet.slug}`,
      label: label(facet),
    })),
    title,
  };
}

async function loadFooterData() {
  try {
    const [pool, settings] = await Promise.all([
      listPublishedJobs({ limit: BOARD_POOL_LIMIT, page: 1 }),
      getSiteSettings(),
    ]);
    return { pool, settings };
  } catch {
    return null;
  }
}

export async function SiteFooter({
  bordfulMark = false,
  columns,
  logoUrl,
  name,
  showAttribution,
  showCta,
  social,
  tagline,
}: {
  bordfulMark?: boolean;
  columns: FooterColumn[];
  // Accepted for compatibility with BoardShell. The Post a Job band is gone.
  durationDays?: number;
  logoUrl: string | null;
  name: string;
  priceLabel?: string;
  showAttribution: boolean;
  showCta: boolean;
  social: SocialProfiles;
  tagline: string;
}) {
  const data = await loadFooterData();
  const items = data?.pool.items ?? [];
  const taxonomy = countTaxonomy(items);
  const alertsEnabled = data?.settings.alerts.enabled ?? false;

  const employers: FooterColumn = {
    id: "employers",
    items: [
      ...(showCta ? [{ href: "/post", id: "post", label: "Post a job" }] : []),
      { href: "/companies", id: "companies", label: "Companies" },
    ],
    title: "Employers",
  };

  const categories = categoryColumn(items);
  const footerColumns = [
    categories,
    facetColumn("location", "Jobs by location", taxonomy.locations, (facet) =>
      facet.slug === "remote" ? "Remote jobs" : `Jobs in ${facet.label}`
    ),
    facetColumn(
      "level",
      "Jobs by level",
      taxonomy.levels,
      (facet) => `${facet.label} jobs`
    ),
    // Paper swaps types for categories; the types hub stays one click away.
    categories
      ? null
      : facetColumn(
          "type",
          "Jobs by type",
          taxonomy.types,
          (facet) => `${facet.label} jobs`
        ),
    employers,
    ...mergeLegal(
      columns.filter((column) => !REPLACED_COLUMN_IDS.has(column.id))
    ),
  ].filter((column): column is FooterColumn => column !== null);

  return (
    <>
      <FooterView
        bordfulMark={bordfulMark}
        columns={footerColumns}
        logoUrl={logoUrl}
        name={name}
        showAlert={alertsEnabled}
        showAttribution={showAttribution}
        social={social}
        stats={
          data
            ? {
                companies: companiesFromPool(items).length,
                openRoles: data.pool.totalDocs,
              }
            : null
        }
        // The board description is the site's own blurb, as the RSS feed
        // uses it; Paper shows it under the logo when no tagline is set.
        tagline={tagline || data?.settings.board.description || ""}
      />
      <TabBar
        alertsEnabled={alertsEnabled}
        homeHref={boardHomePath(isMarketingEnabled())}
      />
    </>
  );
}
