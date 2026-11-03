import type { Metadata } from "next";

import { PickRoleCard } from "@/components/board/board-listing";
import { BoardRail } from "@/components/board/board-rail";
import { BoardShell } from "@/components/board/board-shell";
import { SavedJobsView } from "@/components/board/saved-jobs-view";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath } from "@/config/nav";
import { loadBoardPool } from "@/lib/board/pool";
import { type BoardSearchParams, parseBoardQuery } from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";

export const metadata: Metadata = {
  robots: { follow: true, index: false },
  title: "Saved jobs",
};

// Saved and applied jobs live in the visitor's browser, so this page sends
// the live pool and the client picks the rows by slug.
export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<BoardSearchParams>;
}) {
  const { list } = await searchParams;
  const kind = list === "applied" ? "applied" : "saved";
  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const marketing = isMarketingEnabled();
  const options = { defaultPerPage: settings.board.jobsPerPage };
  const query = parseBoardQuery(new URLSearchParams(""), options);

  return (
    <BoardShell fullBleed>
      <div className="flex min-h-[calc(100dvh-3.25rem)] flex-col">
        <SavedJobsView
          aside={
            <div className="hidden flex-col gap-4 py-2 pr-2 xl:flex">
              <PickRoleCard />
            </div>
          }
          boardHref={boardHomePath(marketing)}
          cards={cards}
          kind={kind}
          now={Date.now()}
          rail={
            <div className="border-line lg:border-r">
              <BoardRail
                marketing={marketing}
                options={options}
                query={query}
                view={kind}
              />
            </div>
          }
        />
      </div>
    </BoardShell>
  );
}
