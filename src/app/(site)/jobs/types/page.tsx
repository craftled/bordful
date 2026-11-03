import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";

export const metadata: Metadata = {
  title: "Jobs by type",
};

export default function TypeIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="type" />
    </BoardShell>
  );
}
