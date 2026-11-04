import type { Metadata } from "next";
import { headers } from "next/headers";

import { MarketingHome } from "@/app/(marketing)/_components/marketing-home";
import { BoardHome } from "@/components/board/board-home";
import { BoardShell } from "@/components/board/board-shell";
import { marketingHomeMetadata } from "@/components/marketing/metadata";
import { isMarketingEnabled } from "@/config/flags";
import { parseBoardQuery } from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";

// The board home keeps the (site) layout's metadata.
export async function generateMetadata(): Promise<Metadata> {
  await headers();

  return isMarketingEnabled() ? marketingHomeMetadata() : {};
}

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
