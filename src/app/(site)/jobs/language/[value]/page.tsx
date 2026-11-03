import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import {
  redirectTaxonomyAlias,
  TaxonomyArchive,
} from "@/components/board/taxonomy-archive";
import type { BoardSearchParams } from "@/lib/board/query";
import { taxonomyArchiveMetadata } from "@/lib/board/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ value: string }>;
}): Promise<Metadata> {
  const { value } = await params;
  return taxonomyArchiveMetadata("language", value);
}

export default async function LanguageArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ value: string }>;
  searchParams: Promise<BoardSearchParams>;
}) {
  const { value } = await params;
  redirectTaxonomyAlias("language", value, 1);

  return (
    <BoardShell fullBleed>
      <TaxonomyArchive
        kind="language"
        page={1}
        searchParams={await searchParams}
        value={value}
      />
    </BoardShell>
  );
}
