import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";
import { boardMarkdownAlternate } from "@/lib/docs/markdown-alternate";

export function generateMetadata(): Metadata {
  return {
    alternates: {
      canonical: "/jobs/locations",
      types: boardMarkdownAlternate("/jobs/locations"),
    },
    title: "Jobs by location",
  };
}

export default function LocationIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="location" />
    </BoardShell>
  );
}
