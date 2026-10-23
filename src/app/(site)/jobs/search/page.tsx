import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BoardListing } from "@/components/board/board-listing";
import { BoardShell } from "@/components/board/board-shell";
import { isMarketingEnabled } from "@/config/flags";
import { canonicalSearchRedirect } from "@/lib/board/canonical";
import { loadBoardPool } from "@/lib/board/pool";
import {
  type BoardSearchParams,
  parseBoardQuery,
  urlSearchParamsFromRecord,
} from "@/lib/board/query";
import { buildBoardView } from "@/lib/board/view";
import { getSiteSettings } from "@/lib/read";

export const metadata: Metadata = {
  robots: { follow: true, index: false },
  title: "Search",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<BoardSearchParams>;
}) {
  const settings = await getSiteSettings();
  const options = { defaultPerPage: settings.board.jobsPerPage };
  const params = urlSearchParamsFromRecord(await searchParams);
  const target = canonicalSearchRedirect(params, options);
  if (target) {
    redirect(target);
  }

  const query = parseBoardQuery(params, options);
  const cards = await loadBoardPool();
  if (buildBoardView(cards, query).outOfRange) {
    notFound();
  }

  return (
    <BoardShell>
      <BoardListing
        cards={cards}
        heading={settings.board.title || "Latest jobs"}
        intro={settings.board.description}
        marketing={isMarketingEnabled()}
        options={options}
        query={query}
      />
    </BoardShell>
  );
}
