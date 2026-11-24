import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";

export const metadata: Metadata = {
  alternates: {
    canonical: "/jobs/locations",
    types: { "text/markdown": markdownPathFor("/jobs/locations") },
  },
  title: "Jobs by location",
};

export default function LocationIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="location" />
    </BoardShell>
  );
}
