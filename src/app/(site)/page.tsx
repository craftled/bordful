import { MarketingHome } from "@/app/(marketing)/_components/marketing-home";
import { BoardHome } from "@/components/board/board-home";
import { BoardShell } from "@/components/board/board-shell";
import { isMarketingEnabled } from "@/config/flags";
import { parseBoardQuery } from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";

export default async function HomePage() {
  if (isMarketingEnabled()) {
    return <MarketingHome />;
  }

  const settings = await getSiteSettings();
  const options = { defaultPerPage: settings.board.jobsPerPage };

  return (
    <BoardShell
      fullBleed
      search={{
        options,
        query: parseBoardQuery(new URLSearchParams(""), options),
      }}
    >
      <BoardHome />
    </BoardShell>
  );
}
