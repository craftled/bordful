import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { SavedJobsView } from "@/components/board/saved-jobs-view";
import { Crumbs, PageFrame } from "@/components/board/taxonomy-hub";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath } from "@/config/nav";
import { loadBoardPool } from "@/lib/board/pool";
import type { BoardSearchParams } from "@/lib/board/query";
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
  const boardHref = boardHomePath(isMarketingEnabled());

  return (
    <BoardShell fullBleed>
      <PageFrame>
        {/* Paper sets these crumbs on a 16px line; the shared Crumbs use 19px. */}
        <div className="md:[&>nav]:leading-4">
          <Crumbs
            items={[
              { href: boardHref, label: "Jobs" },
              { label: kind === "applied" ? "Applied" : "Saved" },
            ]}
          />
        </div>
        <SavedJobsView
          alertsEnabled={settings.alerts.enabled}
          boardHref={boardHref}
          cards={cards}
          kind={kind}
          now={Date.now()}
        />
      </PageFrame>
    </BoardShell>
  );
}
