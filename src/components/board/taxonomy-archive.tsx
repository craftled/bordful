import { notFound, permanentRedirect } from "next/navigation";

import { BoardListing } from "@/components/board/board-listing";
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
  taxonomySearchQuery,
  taxonomyTitle,
} from "@/lib/board/taxonomy";
import { buildBoardView } from "@/lib/board/view";
import { getSiteSettings } from "@/lib/read";

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
  if (buildBoardView(listingCards, query).outOfRange) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BoardListing
        archiveKind={kind}
        archiveValue={value}
        cards={listingCards}
        heading={taxonomyTitle(kind, value)}
        headingTestId="taxonomy-heading"
        marketing={isMarketingEnabled()}
        options={options}
        query={query}
        showControls={searchQuery !== null}
        showFilters={searchQuery !== null}
      />
    </div>
  );
}
