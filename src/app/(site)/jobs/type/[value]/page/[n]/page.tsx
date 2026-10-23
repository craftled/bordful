import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import { TaxonomyArchive } from "@/components/board/taxonomy-archive";
import { buildTaxonomyArchivePath, parsePathPage } from "@/lib/board/paths";
import { taxonomyTitle } from "@/lib/board/taxonomy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string; value: string }>;
}): Promise<Metadata> {
  const { value } = await params;
  return { title: taxonomyTitle("type", value) };
}

export default async function TypeArchivePagedPage({
  params,
}: {
  params: Promise<{ n: string; value: string }>;
}) {
  const { n, value } = await params;
  const page = parsePathPage(n);
  if (page === null) {
    notFound();
  }
  if (page === 1) {
    permanentRedirect(buildTaxonomyArchivePath("type", value, 1));
  }

  return (
    <BoardShell>
      <TaxonomyArchive kind="type" page={page} value={value} />
    </BoardShell>
  );
}
