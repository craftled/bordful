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
  return taxonomyArchiveMetadata("type", value);
}

export default async function TypeArchivePage({
  params,
}: {
  params: Promise<{ value: string }>;
}) {
  const { value } = await params;
  redirectTaxonomyAlias("type", value, 1);

  return (
    <BoardShell>
      <TaxonomyArchive kind="type" page={1} value={value} />
    </BoardShell>
  );
}
