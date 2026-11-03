import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  DOCS_REPO_BASE,
  DOCS_SLUGS,
  docSummary,
  docTitle,
  listDocs,
  readDoc,
} from "@/components/marketing/docs-content";
import { DocsFrame, DocsPager } from "@/components/marketing/docs-layout";
import {
  DocsMarkdown,
  extractHeadings,
} from "@/components/marketing/docs-markdown";
import { GITHUB_URL } from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const dynamicParams = false;

export function generateStaticParams() {
  return DOCS_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const source = readDoc(slug);
  if (!source) {
    return {};
  }
  return {
    description: docSummary(source),
    title: `${docTitle(source, slug)} | Docs`,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  assertMarketingEnabled();
  const { slug } = await params;
  const source = readDoc(slug);
  if (!source) {
    notFound();
  }

  const entries = listDocs();
  const index = DOCS_SLUGS.indexOf(slug);
  const title = docTitle(source, slug);
  const prev = index > 0 ? entries[index - 1] : undefined;
  const next = entries[index + 1];

  return (
    <DocsFrame
      active={slug}
      entries={entries}
      headings={extractHeadings(source)}
    >
      <p className="text-[13px] leading-4">
        <span className="text-subtle">Docs / </span>
        <span className="text-foreground">{title}</span>
      </p>
      <h1 className="text-foreground mt-5 mb-6 text-[32px] leading-10 font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]">
        {title}
      </h1>
      <DocsMarkdown repoBase={DOCS_REPO_BASE} skipTitle source={source} />
      <DocsPager
        next={
          next ? { href: `/docs/${next.slug}`, label: next.title } : undefined
        }
        previous={
          prev
            ? { href: `/docs/${prev.slug}`, label: prev.title }
            : { href: "/docs", label: "Overview" }
        }
      />
      <p className="text-muted-foreground mt-8 text-[13px] leading-5">
        <a
          className="text-foreground underline underline-offset-4"
          href={`${GITHUB_URL}/edit/main/docs/${slug}.md`}
          rel="noopener noreferrer"
          target="_blank"
        >
          Edit this page on GitHub
        </a>
      </p>
    </DocsFrame>
  );
}
