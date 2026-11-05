import type { Metadata } from "next";
import { headers } from "next/headers";

import { MarketingHome } from "@/app/(marketing)/_components/marketing-home";
import { BoardHome } from "@/components/board/board-home";
import { BoardShell } from "@/components/board/board-shell";
import { JsonLd } from "@/components/marketing/json-ld";
import { marketingHomeMetadata } from "@/components/marketing/metadata";
import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import { parseBoardQuery } from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";
import { marketingHomeJsonLd } from "@/lib/seo/structured-data";

// The board home keeps the (site) layout's metadata.
export async function generateMetadata(): Promise<Metadata> {
  await headers();

  return isMarketingEnabled() ? marketingHomeMetadata() : {};
}

export default async function HomePage() {
  if (isMarketingEnabled()) {
    const nonce = (await headers()).get("x-nonce") ?? undefined;

    return (
      <>
        <JsonLd data={marketingHomeJsonLd(resolveServerUrl())} nonce={nonce} />
        <MarketingHome />
      </>
    );
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
