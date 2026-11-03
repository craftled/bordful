import { BoardHero } from "@/components/board/board-hero";
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
    <>
      <BoardHero
        badge={settings.name}
        cards={cards}
        intro={settings.board.description}
        options={options}
        query={query}
        title={settings.board.title}
      />
      <div className="mx-auto w-full max-w-board px-4 py-8">
        <BoardListing
          cards={cards}
          marketing={isMarketingEnabled()}
          options={options}
          postJob={settings.postJob.enabled ? settings.postJob : null}
          query={query}
          showHeading={false}
          showSearch={false}
        />
      </div>
    </>
  );
}
