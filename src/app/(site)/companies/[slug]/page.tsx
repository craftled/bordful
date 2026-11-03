import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import {
  COMPANY_SIDE_CARD,
  CompanyFactsStrip,
  CompanyLogoTile,
  CompanyRoles,
  companyFacts,
  companySubline,
  companyWebsite,
  SimilarCompaniesCard,
} from "@/components/board/company-profile";
import { Crumbs, PageFrame } from "@/components/board/taxonomy-hub";
import { loadCompanyPage } from "@/lib/board/companies";
import { editorState } from "@/lib/board/plaintext";
import { loadBoardPool } from "@/lib/board/pool";
import {
  companyStatsFromPool,
  similarCompanies,
} from "@/lib/read/company-stats";
import { cn } from "@/lib/utils";

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

// Paper's company page: logo tile and name with a Website button, a strip of
// the facts the data has, then the open roles beside an About card and
// similar companies. Follow is left out: alerts cannot filter by company.
export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [loaded, pool] = await Promise.all([
    loadCompanyPage(slug),
    loadBoardPool(),
  ]);
  if (!loaded) {
    notFound();
  }

  const { company, jobs } = loaded;
  const now = Date.now();
  const description = editorState(company.description);
  const website = companyWebsite(company);
  const subline = companySubline(company, website);
  const stats = companyStatsFromPool(pool, now);
  const similar = similarCompanies(stats, slug);
  const facts = companyFacts(
    company,
    stats.get(slug)?.location ?? null,
    jobs.length
  );

  return (
    <BoardShell fullBleed>
      <PageFrame>
        {/* Paper sets these crumbs on a 16px line; the shared Crumbs use 19px. */}
        <div className="md:[&>nav]:leading-4">
          <Crumbs
            items={[
              { href: "/jobs", label: "Jobs" },
              { href: "/companies", label: "Companies" },
              { label: company.name },
            ]}
          />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <CompanyLogoTile logoUrl={company.logoUrl} name={company.name} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1
                className="text-foreground text-[24px] leading-[30px] font-medium tracking-[-0.03em] md:text-[40px] md:leading-[48px]"
                data-testid="company-name"
              >
                {company.name}
              </h1>
              {subline ? (
                <p className="text-muted-foreground text-[13px] leading-4 md:text-[14px] md:leading-[18px]">
                  {subline}
                </p>
              ) : null}
            </div>
          </div>
          {website ? (
            <a
              className="bg-card ring-line-strong text-foreground hover:bg-surface-sub flex h-11 shrink-0 items-center justify-center rounded-lg px-3.5 text-[14px] leading-[18px] font-medium ring-1 transition-colors md:h-9"
              data-testid="company-website"
              href={website}
              rel="noopener noreferrer"
              target="_blank"
            >
              Website
            </a>
          ) : null}
        </div>
        {description ? (
          <div className="text-muted-foreground text-[14px] leading-5 lg:hidden">
            <RichText data={description} />
          </div>
        ) : null}
        <CompanyFactsStrip facts={facts} />
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_324px] lg:items-start lg:gap-8">
          <CompanyRoles jobs={jobs} now={now} />
          {description || similar.length > 0 ? (
            <aside className="flex flex-col gap-4">
              {description ? (
                <section
                  aria-labelledby="about-company-title"
                  className={cn(COMPANY_SIDE_CARD, "hidden lg:flex")}
                >
                  <h2
                    className="text-subtle text-[13px] leading-4 font-normal"
                    id="about-company-title"
                  >
                    About {company.name}
                  </h2>
                  <div className="text-muted-foreground text-[14px] leading-[18px]">
                    <RichText data={description} />
                  </div>
                </section>
              ) : null}
              <SimilarCompaniesCard companies={similar} />
            </aside>
          ) : null}
        </div>
      </PageFrame>
    </BoardShell>
  );
}
