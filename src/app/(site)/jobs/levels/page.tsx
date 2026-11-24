import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { boardMarkdownAlternate } from "@/lib/docs/markdown-alternate";

export function generateMetadata(): Metadata {
  return {
    alternates: {
      canonical: "/jobs/levels",
      types: boardMarkdownAlternate("/jobs/levels"),
    },
    title: "Jobs by level",
  };
}

export default function LevelIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="level" />
    </BoardShell>
  );
}
