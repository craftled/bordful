import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";

export const metadata: Metadata = {
  title: "Jobs by language",
};

export default function LanguageIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="language" />
    </BoardShell>
  );
}
