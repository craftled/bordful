import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { QuestionList } from "@/components/marketing/faq";
import { CUSTOM_SETUP_URL, DEPLOY_URL } from "@/components/marketing/links";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { Button } from "@/components/ui/button";

import { Breadcrumb } from "./breadcrumb";
import {
  ALTERNATIVES_CUSTOM_SETUP_NOTE,
  ALTERNATIVES_PAGE_CTA,
  ALTERNATIVES_PAGE_LABELS,
  factsCheckedOn,
  formatCheckedOn,
} from "./registry";
import type { Alternative, Claim, Source } from "./types";

function SourceMarkers({
  page,
  sources,
}: {
  page: Alternative;
  sources: readonly string[];
}) {
  const sortedSources = [...sources].sort(
    (left, right) =>
      page.sources.findIndex((source) => source.id === left) -
      page.sources.findIndex((source) => source.id === right)
  );

  return (
    <span className="text-primary hover:text-foreground -my-1 inline-flex gap-1 align-baseline">
      {sortedSources.map((id) => {
        const sourceIndex = page.sources.findIndex(
          (candidate) => candidate.id === id
        );
        const sourceRecord = page.sources[sourceIndex];
        if (!sourceRecord) {
          return null;
        }

        const number = sourceIndex + 1;
        return (
          <a
            aria-label={`Source ${number}: ${sourceRecord.title}`}
            className="text-primary hover:text-foreground inline-flex size-6 shrink-0 items-center justify-center rounded-sm text-[11px] leading-4 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            href={`#source-${sourceRecord.id}`}
            key={id}
          >
            [{number}]
          </a>
        );
      })}
    </span>
  );
}

function ClaimText({ claim, page }: { claim: Claim; page: Alternative }) {
  return (
    <>
      {claim.text}
      <SourceMarkers page={page} sources={claim.sources} />
    </>
  );
}

function Hero({ page }: { page: Alternative }) {
  return (
    <Section className="md:py-14">
      <Container className="flex flex-col gap-5 md:items-center md:gap-[18px] md:text-center">
        <SectionHeader
          description={<ClaimText claim={page.lede} page={page} />}
          eyebrow="Alternatives"
          headingLevel="h1"
          title={page.heading.title}
          titleMuted={page.heading.titleMuted}
        />
        <div className="flex flex-col gap-2 self-stretch md:flex-row md:self-auto">
          <Button
            asChild
            className="h-11 px-4 text-[15px] md:h-9 md:text-[13px]"
          >
            <a href={DEPLOY_URL} rel="noopener noreferrer" target="_blank">
              Deploy to Vercel
            </a>
          </Button>
          <Button
            asChild
            className="h-11 px-4 text-[15px] md:h-9 md:text-[13px]"
            variant="outline"
          >
            <a
              href={CUSTOM_SETUP_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              Custom Setup, $999 once
            </a>
          </Button>
        </div>
        <p className="text-subtle text-[12px] leading-[18px] md:text-center">
          {ALTERNATIVES_CUSTOM_SETUP_NOTE}
        </p>
      </Container>
    </Section>
  );
}

function ClaimList({
  claims,
  page,
}: {
  claims: readonly Claim[];
  page: Alternative;
}) {
  return (
    <ul className="text-muted-foreground marker:text-subtle flex list-disc flex-col gap-3 pl-5 text-[14px] leading-[21px]">
      {claims.map((claim) => (
        <li key={claim.text}>
          <ClaimText claim={claim} page={page} />
        </li>
      ))}
    </ul>
  );
}

function Verdict({ page }: { page: Alternative }) {
  return (
    <Section>
      <Container className="flex flex-col gap-8">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <section
            aria-labelledby="stay-heading"
            className="flex flex-col gap-4"
          >
            <h2
              className="text-foreground text-[20px] leading-7 font-medium tracking-[-0.02em]"
              id="stay-heading"
            >
              {ALTERNATIVES_PAGE_LABELS.stayPrefix} {page.name}{" "}
              {ALTERNATIVES_PAGE_LABELS.staySuffix}
            </h2>
            <ClaimList claims={page.stay} page={page} />
          </section>
          <section
            aria-labelledby="switch-heading"
            className="flex flex-col gap-4"
          >
            <h2
              className="text-foreground text-[20px] leading-7 font-medium tracking-[-0.02em]"
              id="switch-heading"
            >
              {ALTERNATIVES_PAGE_LABELS.switch}
            </h2>
            <ClaimList claims={page.switch} page={page} />
          </section>
        </div>
        <section
          aria-labelledby="limits-heading"
          className="bg-secondary flex flex-col gap-4 rounded-xl p-5 md:p-6"
        >
          <h2
            className="text-foreground text-[18px] leading-6 font-medium"
            id="limits-heading"
          >
            {ALTERNATIVES_PAGE_LABELS.limits}
          </h2>
          <ClaimList claims={page.limits} page={page} />
        </section>
      </Container>
    </Section>
  );
}

function ComparisonTable({
  caption,
  page,
  rows,
}: {
  caption: string;
  page: Alternative;
  rows: Alternative["comparison"];
}) {
  return (
    <section className="border-line max-w-full rounded-lg border">
      <table
        aria-label={caption}
        className="w-full border-collapse text-left text-[13px] leading-5"
        // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
        role="table"
      >
        <caption className="sr-only">{caption}</caption>
        <thead
          className="bg-secondary max-md:sr-only"
          // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
          role="rowgroup"
        >
          <tr
            // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
            role="row"
          >
            <th
              className="border-line w-[160px] border-b px-4 py-3 font-medium"
              // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
              role="columnheader"
              scope="col"
            >
              <span className="sr-only">Category</span>
            </th>
            <th
              className="text-foreground border-line w-[300px] border-b px-4 py-3 font-medium"
              // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
              role="columnheader"
              scope="col"
            >
              {page.name}
            </th>
            <th
              className="text-foreground border-line w-[300px] border-b px-4 py-3 font-medium"
              // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
              role="columnheader"
              scope="col"
            >
              Bordful
            </th>
          </tr>
        </thead>
        <tbody
          // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
          role="rowgroup"
        >
          {rows.map((row) => (
            <tr
              className="max-md:border-line align-top max-md:grid max-md:grid-cols-2 max-md:border-b md:table-row"
              key={row.label}
              // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
              role="row"
            >
              <th
                className="text-foreground border-line col-span-2 border-b px-4 py-3 font-medium max-md:border-b-0 max-md:px-3 max-md:pb-1 md:border-b"
                // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
                role="rowheader"
                scope="row"
              >
                {row.label}
              </th>
              <td
                className="text-muted-foreground border-line border-b px-4 py-3 last:border-b-0 max-md:flex max-md:flex-col max-md:gap-1 max-md:border-r max-md:border-b-0 max-md:px-3 max-md:py-2 md:table-cell"
                // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
                role="cell"
              >
                <span
                  aria-hidden="true"
                  className="text-foreground text-[11px] font-medium md:hidden"
                >
                  {page.name}
                </span>
                <ClaimText claim={row.competitor} page={page} />
              </td>
              <td
                className="text-muted-foreground border-line border-b px-4 py-3 last:border-b-0 max-md:flex max-md:flex-col max-md:gap-1 max-md:border-b-0 max-md:px-3 max-md:py-2 md:table-cell"
                // biome-ignore lint/a11y/noRedundantRoles: Explicit roles preserve table semantics when CSS changes native table displays.
                role="cell"
              >
                <span
                  aria-hidden="true"
                  className="text-foreground text-[11px] font-medium md:hidden"
                >
                  Bordful
                </span>
                <ClaimText claim={row.bordful} page={page} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Migration({ page }: { page: Alternative }) {
  return (
    <Section>
      <Container className="flex flex-col gap-8">
        <SectionHeader
          description={page.migration.intro}
          title={`Moving from ${page.name}`}
          titleMuted={ALTERNATIVES_PAGE_LABELS.migrationTitleMuted}
        />
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <section
            aria-labelledby="moves-heading"
            className="flex flex-col gap-4"
          >
            <h3
              className="text-foreground text-[17px] leading-6 font-medium"
              id="moves-heading"
            >
              {ALTERNATIVES_PAGE_LABELS.moves}
            </h3>
            <ClaimList claims={page.migration.moves} page={page} />
          </section>
          <section
            aria-labelledby="behind-heading"
            className="flex flex-col gap-4"
          >
            <h3
              className="text-foreground text-[17px] leading-6 font-medium"
              id="behind-heading"
            >
              {ALTERNATIVES_PAGE_LABELS.staysBehind}
            </h3>
            <ClaimList claims={page.migration.staysBehind} page={page} />
          </section>
        </div>
        <section aria-labelledby="path-heading" className="flex flex-col gap-4">
          <h3
            className="text-foreground text-[17px] leading-6 font-medium"
            id="path-heading"
          >
            {ALTERNATIVES_PAGE_LABELS.path}
          </h3>
          <ol className="text-muted-foreground marker:text-subtle flex list-decimal flex-col gap-3 pl-5 text-[14px] leading-[21px]">
            {page.migration.steps.map((step) => (
              <li key={typeof step === "string" ? step : step.text}>
                {typeof step === "string" ? (
                  step
                ) : (
                  <ClaimText claim={step} page={page} />
                )}
              </li>
            ))}
          </ol>
        </section>
      </Container>
    </Section>
  );
}

function Sources({
  checkedOn,
  sources,
}: {
  checkedOn: string;
  sources: readonly Source[];
}) {
  return (
    <Section>
      <Container className="flex flex-col gap-5">
        <SectionHeader title={ALTERNATIVES_PAGE_LABELS.sources} />
        <p className="text-subtle text-[12px] leading-[18px]">
          {ALTERNATIVES_PAGE_LABELS.factsChecked} {checkedOn}
          {ALTERNATIVES_PAGE_LABELS.factsCheckedSuffix}
        </p>
        <ol className="text-muted-foreground marker:text-subtle flex list-decimal flex-col gap-4 pl-5 text-[13px] leading-5">
          {sources.map((source) => (
            <li id={`source-${source.id}`} key={source.id}>
              <a
                className="text-foreground hover:text-primary rounded-sm underline underline-offset-2"
                href={source.url}
                rel="noopener noreferrer"
                target="_blank"
              >
                {source.title}
              </a>
              <p className="mt-1">{source.fact}</p>
              <p className="text-subtle mt-1 text-[12px]">
                Checked {formatCheckedOn(source.checkedOn)}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

function faqItemsWithMarkers(page: Alternative) {
  return page.faq.map((item) => ({
    ...item,
    after: <SourceMarkers page={page} sources={item.sources} />,
  }));
}

export function AlternativeView({ page }: { page: Alternative }) {
  const checkedOn = formatCheckedOn(factsCheckedOn(page));

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/", label: "Home" },
          { href: "/alternatives", label: "Alternatives" },
          { label: page.name },
        ]}
      />
      <Hero page={page} />
      <Verdict page={page} />
      <Section>
        <Container className="flex flex-col gap-5">
          <SectionHeader
            title={`${page.name} and Bordful`}
            titleMuted={ALTERNATIVES_PAGE_LABELS.compared}
          />
          <ComparisonTable
            caption={`${page.name} and Bordful compared`}
            page={page}
            rows={page.comparison}
          />
          <p className="text-subtle text-[12px] leading-[18px]">
            {ALTERNATIVES_PAGE_LABELS.sourcesNote} {checkedOn}.
          </p>
        </Container>
      </Section>
      <Section>
        <Container className="flex flex-col gap-5">
          <SectionHeader
            title="Pricing"
            titleMuted={ALTERNATIVES_PAGE_LABELS.compared}
          />
          <ComparisonTable
            caption="Pricing compared"
            page={page}
            rows={page.pricing}
          />
          <p className="text-subtle text-[12px] leading-[18px]">
            {ALTERNATIVES_PAGE_LABELS.pricesNote} {checkedOn}.
          </p>
        </Container>
      </Section>
      <Migration page={page} />
      <Section>
        <Container className="flex flex-col gap-5">
          <SectionHeader
            description={ALTERNATIVES_PAGE_LABELS.faqDescription}
            title={ALTERNATIVES_PAGE_LABELS.faqTitle}
            titleMuted={ALTERNATIVES_PAGE_LABELS.faqTitleMuted}
          />
          <QuestionList
            className="md:max-w-[900px]"
            items={faqItemsWithMarkers(page)}
          />
        </Container>
      </Section>
      <Section>
        <Container>
          <Link
            className="text-foreground hover:text-primary rounded-sm text-[14px] font-medium underline underline-offset-4"
            href="/alternatives"
          >
            All alternatives
          </Link>
        </Container>
      </Section>
      <MarketingCta
        actions={[
          { external: true, href: DEPLOY_URL, label: "Deploy to Vercel" },
          {
            external: true,
            href: CUSTOM_SETUP_URL,
            label: "Custom Setup, $999 once",
          },
        ]}
        description={ALTERNATIVES_PAGE_CTA.description}
        title={ALTERNATIVES_PAGE_CTA.title}
        titleMuted={ALTERNATIVES_PAGE_CTA.titleMuted}
      />
      <Sources checkedOn={checkedOn} sources={page.sources} />
      <MarketingSlimFooter />
    </>
  );
}
