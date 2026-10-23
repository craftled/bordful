import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardList, jobCountLabel } from "@/components/board/board-list";
import { BoardShell } from "@/components/board/board-shell";
import { httpUrl } from "@/lib/board/apply";
import { loadCompanyPage } from "@/lib/board/companies";
import { editorState } from "@/lib/board/plaintext";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadCompanyPage(slug);
  if (!loaded) {
    return { title: "Company" };
  }

  return {
    robots: loaded.noindex ? { follow: true, index: false } : undefined,
    title: loaded.company.name,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loaded = await loadCompanyPage(slug);
  if (!loaded) {
    notFound();
  }

  const description = editorState(loaded.company.description);
  const now = Date.now();
  const website = httpUrl(loaded.company.website?.trim() ?? "");

  return (
    <BoardShell>
      <div className="space-y-6">
        <header className="space-y-2">
          <h1
            className="font-[var(--font-heading)] font-semibold text-3xl"
            data-testid="company-name"
          >
            {loaded.company.name}
          </h1>
          <p className="text-muted-foreground">
            {jobCountLabel(loaded.jobs.length)}
          </p>
          {website ? (
            <a href={website} rel="noopener noreferrer">
              {website}
            </a>
          ) : null}
        </header>
        {description ? <RichText data={description} /> : null}
        <BoardList jobs={loaded.jobs} now={now} />
      </div>
    </BoardShell>
  );
}
