import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyIndex } from "@/components/board/taxonomy-index";

export const metadata: Metadata = {
  title: "Jobs by level",
};

export default function LevelIndexPage() {
  return (
    <BoardShell fullBleed>
      <TaxonomyIndex kind="level" />
    </BoardShell>
  );
}
