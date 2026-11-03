import { FooterView } from "@/components/board/footer-view";
import type { SocialProfiles } from "@/components/board/social-links";
import { TabBar } from "@/components/board/tab-bar";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath, type FooterColumn } from "@/config/nav";
import { companiesFromPool } from "@/lib/board/companies";
import { BOARD_POOL_LIMIT } from "@/lib/board/constants";
import { countTaxonomy, type TaxonomyFacet } from "@/lib/board/taxonomy";
import { getSiteSettings, listPublishedJobs } from "@/lib/read";

const FACET_LIMIT = 5;

// These columns are replaced by the facet columns and the RSS button.
const REPLACED_COLUMN_IDS = new Set(["feeds", "jobs"]);

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
  columns,
  logoUrl,
  name,
  showAttribution,
  showCta,
  social,
  tagline,
}: {
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

  const footerColumns = [
    facetColumn("location", "Jobs by location", taxonomy.locations, (facet) =>
      facet.slug === "remote" ? "Remote jobs" : `Jobs in ${facet.label}`
    ),
    facetColumn(
      "level",
      "Jobs by level",
      taxonomy.levels,
      (facet) => `${facet.label} jobs`
    ),
    facetColumn(
      "type",
      "Jobs by type",
      taxonomy.types,
      (facet) => `${facet.label} jobs`
    ),
    employers,
    ...columns.filter((column) => !REPLACED_COLUMN_IDS.has(column.id)),
  ].filter((column): column is FooterColumn => column !== null);

  return (
    <>
      <FooterView
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
        tagline={tagline}
      />
      <TabBar
        alertsEnabled={alertsEnabled}
        homeHref={boardHomePath(isMarketingEnabled())}
      />
    </>
  );
}
