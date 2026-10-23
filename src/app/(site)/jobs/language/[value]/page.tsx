import type { Metadata } from "next";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyArchive } from "@/components/board/taxonomy-archive";
import { taxonomyTitle } from "@/lib/board/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ value: string }>;
}): Promise<Metadata> {
  const { value } = await params;
  return { title: taxonomyTitle("language", value) };
}

export default async function LanguageArchivePage({
  params,
}: {
  params: Promise<{ value: string }>;
}) {
  const { value } = await params;
  return (
    <BoardShell>
      <TaxonomyArchive kind="language" page={1} value={value} />
    </BoardShell>
  );
}
