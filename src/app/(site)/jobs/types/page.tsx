import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { boardMarkdownAlternate } from "@/lib/docs/markdown-alternate";

export function generateMetadata(): Metadata {
  return {
    alternates: {
      canonical: "/jobs/types",
      types: boardMarkdownAlternate("/jobs/types"),
    },
    title: "Jobs by type",
  };
}

export default function TypeIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="type" />
    </BoardShell>
  );
}
