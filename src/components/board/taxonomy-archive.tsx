import { notFound } from "next/navigation";

import { BoardListing } from "@/components/board/board-listing";
import { isMarketingEnabled } from "@/config/flags";
import { loadBoardPool } from "@/lib/board/pool";
import { parseBoardQuery } from "@/lib/board/query";
import {
  filterByTaxonomy,
  type TaxonomyKind,
  taxonomyTitle,
} from "@/lib/board/taxonomy";
import { buildBoardView } from "@/lib/board/view";
import { getSiteSettings } from "@/lib/read";

export async function TaxonomyArchive({
  kind,
  page,
  value,
}: {
  kind: TaxonomyKind;
  page: number;
  value: string;
}) {
  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const filtered = filterByTaxonomy(cards, kind, value);
  if (!filtered || filtered.length === 0) {
    notFound();
  }

  const options = { defaultPerPage: settings.board.jobsPerPage };
  const query = {
    ...parseBoardQuery(new URLSearchParams(""), options),
    page,
  };
  if (buildBoardView(filtered, query).outOfRange) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <BoardListing
        archiveKind={kind}
        archiveValue={value}
        cards={filtered}
        heading={taxonomyTitle(kind, value)}
        headingTestId="taxonomy-heading"
        marketing={isMarketingEnabled()}
        options={options}
        query={query}
        showFilters={false}
      />
    </div>
  );
}
