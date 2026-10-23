import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BoardListing } from "@/components/board/board-listing";
import { BoardShell } from "@/components/board/board-shell";
import { isMarketingEnabled } from "@/config/flags";
import { buildBoardPagePath, parsePathPage } from "@/lib/board/paths";
import { loadBoardPool } from "@/lib/board/pool";
import { parseBoardQuery } from "@/lib/board/query";
import { buildBoardView } from "@/lib/board/view";
import { getSiteSettings } from "@/lib/read";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  return { title: `Jobs, page ${n}` };
}

export default async function BoardPageNumber({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const page = parsePathPage(n);
  if (page === null) {
    notFound();
  }

  const marketing = isMarketingEnabled();
  if (page === 1) {
    permanentRedirect(buildBoardPagePath(marketing, 1));
  }

  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const options = { defaultPerPage: settings.board.jobsPerPage };
  const query = {
    ...parseBoardQuery(new URLSearchParams(""), options),
    page,
  };
  if (buildBoardView(cards, query).outOfRange) {
    notFound();
  }

  return (
    <BoardShell>
      <BoardListing
        cards={cards}
        heading={settings.board.title || "Latest jobs"}
        intro={settings.board.description}
        marketing={marketing}
        options={options}
        query={query}
      />
    </BoardShell>
  );
}
