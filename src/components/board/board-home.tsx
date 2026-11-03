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
  const query = parseBoardQuery(new URLSearchParams(""), options);

  return (
    <BoardListing
      alertsEnabled={settings.alerts.enabled}
      cards={cards}
      heading={settings.board.title}
      headingTestId="board-hero"
      intro={settings.board.description}
      layout="app"
      marketing={isMarketingEnabled()}
      options={options}
      postJob={settings.postJob.enabled ? settings.postJob : null}
      query={query}
    />
  );
}
