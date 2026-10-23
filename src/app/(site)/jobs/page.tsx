import type { Metadata } from "next";

import { BoardHome } from "@/components/board/board-home";
import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyHub } from "@/components/board/taxonomy-hub";
import { isMarketingEnabled } from "@/config/flags";

export const metadata: Metadata = {
  title: "Jobs",
};

export default function JobsPage() {
  if (isMarketingEnabled()) {
    return (
      <BoardShell>
        <BoardHome />
      </BoardShell>
    );
  }

  return (
    <BoardShell>
      <TaxonomyHub />
    </BoardShell>
  );
}
