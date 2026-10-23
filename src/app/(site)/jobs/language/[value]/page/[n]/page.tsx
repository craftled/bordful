import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import {
  redirectTaxonomyAlias,
  TaxonomyArchive,
} from "@/components/board/taxonomy-archive";
import { buildTaxonomyArchivePath, parsePathPage } from "@/lib/board/paths";
import { taxonomyArchiveMetadata } from "@/lib/board/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string; value: string }>;
}): Promise<Metadata> {
  const { n, value } = await params;
  return taxonomyArchiveMetadata("language", value, parsePathPage(n) ?? 1);
}

export default async function LanguageArchivePagedPage({
  params,
}: {
  params: Promise<{ n: string; value: string }>;
}) {
  const { n, value } = await params;
  const page = parsePathPage(n);
  if (page === null) {
    notFound();
  }
  redirectTaxonomyAlias("language", value, page);
  if (page === 1) {
    permanentRedirect(buildTaxonomyArchivePath("language", value, 1));
  }

  return (
    <BoardShell>
      <TaxonomyArchive kind="language" page={page} value={value} />
    </BoardShell>
  );
}
