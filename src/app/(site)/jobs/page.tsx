import type { Metadata } from "next";

import { BoardHome } from "@/components/board/board-home";
import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { isMarketingEnabled } from "@/config/flags";
import { parseBoardQuery } from "@/lib/board/query";
import { getSiteSettings } from "@/lib/read";

export const metadata: Metadata = {
  title: "Jobs",
};

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
