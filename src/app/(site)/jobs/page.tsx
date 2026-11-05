import type { Metadata } from "next";
import { headers } from "next/headers";

import { BoardHome } from "@/components/board/board-home";
import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { MARKETING_DESCRIPTION } from "@/components/marketing/site";
import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import { parseBoardQuery } from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";
import { jobsIndexMetadata } from "@/lib/seo/jobs-index";

export async function generateMetadata(): Promise<Metadata> {
  await headers();
  const marketing = isMarketingEnabled();

  return jobsIndexMetadata({
    description: marketing ? MARKETING_DESCRIPTION : "Browse open roles.",
    marketing,
    siteUrl: resolveServerUrl(),
  });
}

export default async function JobsPage() {
  if (isMarketingEnabled()) {
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

  return (
    <BoardShell>
      <TaxonomyIndex kind="location" />
    </BoardShell>
  );
}
