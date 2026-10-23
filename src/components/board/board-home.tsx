import { BoardListing } from "@/components/board/board-listing";
import { isMarketingEnabled } from "@/config/flags";
import { loadBoardPool } from "@/lib/board/pool";
import { parseBoardQuery } from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";

export async function BoardHome() {
  const [settings, cards] = await Promise.all([
    getSiteSettings(),
    loadBoardPool(),
  ]);
  const options = { defaultPerPage: settings.board.jobsPerPage };

  return (
    <BoardListing
      cards={cards}
      heading={settings.board.title || "Latest jobs"}
      intro={settings.board.description}
      marketing={isMarketingEnabled()}
      options={options}
      query={parseBoardQuery(new URLSearchParams(""), options)}
    />
  );
}
