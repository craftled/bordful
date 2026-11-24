import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";

export const metadata: Metadata = {
  alternates: {
    canonical: "/jobs/types",
    types: { "text/markdown": markdownPathFor("/jobs/types") },
  },
  title: "Jobs by type",
};

export default function TypeIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="type" />
    </BoardShell>
  );
}
