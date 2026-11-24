import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { boardMarkdownAlternate } from "@/lib/docs/markdown-alternate";

export function generateMetadata(): Metadata {
  return {
    alternates: {
      canonical: "/jobs/languages",
      types: boardMarkdownAlternate("/jobs/languages"),
    },
    title: "Jobs by language",
  };
}

export default function LanguageIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="language" />
    </BoardShell>
  );
}
