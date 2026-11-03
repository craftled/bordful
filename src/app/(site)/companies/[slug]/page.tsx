import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardList, jobCountLabel } from "@/components/board/board-list";
import { BoardShell } from "@/components/board/board-shell";
import { Crumbs, PageFrame, PageTitle } from "@/components/board/taxonomy-hub";
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
    <BoardShell fullBleed>
      <PageFrame>
        <Crumbs
          items={[
            { href: "/jobs", label: "Jobs" },
            { href: "/companies", label: "Companies" },
            { label: loaded.company.name },
          ]}
        />
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <PageTitle
            subtitle={`${jobCountLabel(loaded.jobs.length).replace("job", "open role")}.`}
            testId="company-name"
          >
            {loaded.company.name}
          </PageTitle>
          {website ? (
            <a
              className="text-subtle hover:text-foreground text-[13px] leading-4 break-all transition-colors"
              href={website}
              rel="noopener noreferrer"
            >
              {website}
            </a>
          ) : null}
        </div>
        {description ? (
          <div className="bg-card ring-line text-muted-foreground rounded-[14px] p-5 text-[14px] leading-6 ring-1 md:p-6">
            <RichText data={description} />
          </div>
        ) : null}
        <BoardList jobs={loaded.jobs} now={now} />
      </PageFrame>
    </BoardShell>
  );
}
