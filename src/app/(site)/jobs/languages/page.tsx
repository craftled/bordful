import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";

export const metadata: Metadata = {
  alternates: {
    canonical: "/jobs/languages",
    types: { "text/markdown": markdownPathFor("/jobs/languages") },
  },
  title: "Jobs by language",
};

export default function LanguageIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="language" />
    </BoardShell>
  );
}
