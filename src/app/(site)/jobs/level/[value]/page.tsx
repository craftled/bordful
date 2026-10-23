import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import {
  redirectTaxonomyAlias,
  TaxonomyArchive,
} from "@/components/board/taxonomy-archive";
import { taxonomyArchiveMetadata } from "@/lib/board/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ value: string }>;
}): Promise<Metadata> {
  const { value } = await params;
  return taxonomyArchiveMetadata("level", value);
}

export default async function LevelArchivePage({
  params,
}: {
  params: Promise<{ value: string }>;
}) {
  const { value } = await params;
  redirectTaxonomyAlias("level", value, 1);

  return (
    <BoardShell>
      <TaxonomyArchive kind="level" page={1} value={value} />
    </BoardShell>
  );
}
