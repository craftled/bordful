import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import {
  redirectTaxonomyAlias,
  TaxonomyArchive,
} from "@/components/board/taxonomy-archive";
import { buildTaxonomyArchivePath, parsePathPage } from "@/lib/board/paths";
import type { BoardSearchParams } from "@/lib/board/query";
import { taxonomyArchiveMetadata } from "@/lib/board/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string; value: string }>;
}): Promise<Metadata> {
  const { n, value } = await params;
  return taxonomyArchiveMetadata("location", value, parsePathPage(n) ?? 1);
}

export default async function LocationArchivePagedPage({
  params,
  searchParams,
}: {
  params: Promise<{ n: string; value: string }>;
  searchParams: Promise<BoardSearchParams>;
}) {
  const { n, value } = await params;
  const page = parsePathPage(n);
  if (page === null) {
    notFound();
  }
  redirectTaxonomyAlias("location", value, page);
  if (page === 1) {
    permanentRedirect(buildTaxonomyArchivePath("location", value, 1));
  }

  return (
    <BoardShell fullBleed>
      <TaxonomyArchive
        kind="location"
        page={page}
        searchParams={await searchParams}
        value={value}
      />
    </BoardShell>
  );
}
