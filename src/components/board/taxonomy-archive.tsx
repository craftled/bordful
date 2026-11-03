import { notFound, permanentRedirect } from "next/navigation";

import { BoardListing } from "@/components/board/board-listing";
import { Crumbs, PageTitle } from "@/components/board/taxonomy-hub";
import {
  TAXONOMY_INDEX_LABEL,
  TAXONOMY_INDEX_PATH,
} from "@/components/board/taxonomy-tabs";
import { isMarketingEnabled } from "@/config/flags";
import { formatRelativePosted } from "@/lib/board/format";
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
  const now = Date.now();
  const newest = listingCards
    .map((card) => card.publishedAt)
    .filter((iso): iso is string => Boolean(iso))
    .sort()
    .at(-1);
  const updated = newest ? formatRelativePosted(newest, now) : "";

  return (
    <div>
      <div className="mx-auto flex w-full max-w-[1104px] flex-col gap-5 px-4 pt-2 pb-6 md:gap-8 md:pt-7">
        <Crumbs
          items={[
            { href: "/jobs", label: "Jobs" },
            {
              href: TAXONOMY_INDEX_PATH[kind],
              label: TAXONOMY_INDEX_LABEL[kind],
            },
            { label: taxonomyLabel(kind, slugifyTaxonomyValue(value)) },
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
            <p className="text-subtle hidden items-center gap-[6px] text-[13px] md:flex">
              <span
                aria-hidden="true"
                className="bg-new size-[6px] rounded-full"
              />
              Updated {updated}
            </p>
          ) : null}
        </div>
      </div>
      <BoardListing
        archiveKind={kind}
        archiveValue={value}
        cards={listingCards}
        layout="app"
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
