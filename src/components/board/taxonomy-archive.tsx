import { notFound, permanentRedirect } from "next/navigation";

import { BoardListing } from "@/components/board/board-listing";
import { Crumbs, PageTitle } from "@/components/board/taxonomy-hub";
import { isMarketingEnabled } from "@/config/flags";
import {
  buildTaxonomyArchivePath,
  slugifyTaxonomyValue,
} from "@/lib/board/paths";
import { loadBoardPool } from "@/lib/board/pool";
import { parseBoardQuery } from "@/lib/board/query";
import {
  filterByTaxonomy,
  type TaxonomyKind,
  taxonomyLabel,
  taxonomySearchQuery,
  taxonomyTitle,
} from "@/lib/board/taxonomy";
import { buildBoardView } from "@/lib/board/view";
import { getSiteSettings } from "@/lib/read";

const KIND_LABEL: Record<TaxonomyKind, string> = {
  language: "Languages",
  level: "Levels",
  location: "Locations",
  type: "Types",
};

const HUB_ANCHOR: Record<TaxonomyKind, string> = {
  language: "/jobs#languages",
  level: "/jobs#levels",
  location: "/jobs#locations",
  type: "/jobs#job-types",
};

export function redirectTaxonomyAlias(
  kind: TaxonomyKind,
  value: string,
  page = 1
): void {
  if (slugifyTaxonomyValue(value) !== value) {
    permanentRedirect(buildTaxonomyArchivePath(kind, value, page));
  }
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

  const options = { defaultPerPage: settings.board.jobsPerPage };
  const searchQuery = taxonomySearchQuery(kind, value, page, options);
  const query = searchQuery ?? {
    ...parseBoardQuery(new URLSearchParams(""), options),
    page,
  };
  const listingCards = searchQuery ? cards : filtered;
  const view = buildBoardView(listingCards, query);
  if (view.outOfRange) {
    notFound();
  }

  const title = taxonomyTitle(kind, value);
  const roles = view.matchCount;

  return (
    <div className="space-y-8">
      <Crumbs
        items={[
          { href: "/jobs", label: "Jobs" },
          { href: HUB_ANCHOR[kind], label: KIND_LABEL[kind] },
          { label: taxonomyLabel(kind, slugifyTaxonomyValue(value)) },
        ]}
      />
      <PageTitle
        subtitle={`${roles} open ${roles === 1 ? "role" : "roles"}.`}
        testId="taxonomy-heading"
      >
        {title}
      </PageTitle>
      <BoardListing
        archiveKind={kind}
        archiveValue={value}
        cards={listingCards}
        marketing={isMarketingEnabled()}
        options={options}
        query={query}
        showControls={searchQuery !== null}
        showFilters={searchQuery !== null}
        showHeading={false}
      />
    </div>
  );
}
