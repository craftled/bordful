import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DOCS_REPO_BASE,
  DOCS_SLUGS,
  docLastUpdated,
  docSummary,
  docTitle,
  formatDocDate,
  listDocs,
  readDoc,
} from "@/components/marketing/docs-content";
import { DocsFrame, DocsPager } from "@/components/marketing/docs-layout";
import {
  DocsLede,
  DocsMarkdown,
  extractHeadings,
} from "@/components/marketing/docs-markdown";
import { marketingPageMetadata } from "@/components/marketing/metadata";
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
  return marketingPageMetadata({
    description: docSummary(source),
    path: `/docs/${slug}`,
    title: `${docTitle(source, slug)} | Docs`,
  });
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
  const updated = docLastUpdated(slug);

  return (
    <DocsFrame
      active={slug}
      editHref={`${GITHUB_URL}/edit/main/docs/${slug}.md`}
      entries={entries}
      headings={extractHeadings(source)}
    >
      <div className="flex flex-col gap-6 md:gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[13px] leading-[19px]"
        >
          <Link
            className="text-muted-foreground hover:text-foreground"
            href="/docs"
          >
            Docs
          </Link>
          <ChevronRight
            aria-hidden="true"
            className="text-subtle size-3"
            strokeWidth={1.4}
          />
          <span aria-current="page" className="text-foreground font-medium">
            {title}
          </span>
        </nav>
        <h1 className="text-foreground text-[30px] leading-9 font-medium tracking-[-0.03em] md:text-[34px] md:leading-10">
          {title}
        </h1>
        <DocsLede repoBase={DOCS_REPO_BASE} source={source} />
        {updated ? (
          <p className="text-subtle text-[12px] leading-4 md:leading-[17px]">
            Last updated{" "}
            <time dateTime={updated}>{formatDocDate(updated)}</time>
          </p>
        ) : null}
      </div>
      <DocsMarkdown
        repoBase={DOCS_REPO_BASE}
        skipLede
        skipTitle
        source={source}
      />
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
    </DocsFrame>
  );
}
