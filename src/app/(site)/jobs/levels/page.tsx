import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";

export const metadata: Metadata = {
  alternates: {
    canonical: "/jobs/levels",
    types: { "text/markdown": markdownPathFor("/jobs/levels") },
  },
  title: "Jobs by level",
};

export default function LevelIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="level" />
    </BoardShell>
  );
}
