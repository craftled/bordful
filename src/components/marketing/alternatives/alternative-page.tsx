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
import { factsCheckedOn, formatCheckedOn } from "./registry";
import type { Alternative, Claim, Source } from "./types";

function ClaimText({ claim, page }: { claim: Claim; page: Alternative }) {
  return (
    <>
      {claim.text}
      {claim.sources.map((id) => {
        const sourceIndex = page.sources.findIndex(
          (candidate) => candidate.id === id
        );
        const sourceRecord = page.sources[sourceIndex];
        if (!sourceRecord) {
          return null;
        }

        const number = sourceIndex + 1;
        return (
          <sup className="align-super" key={id}>
            <a
              aria-label={`Source ${number}: ${sourceRecord.title}`}
              className="text-primary hover:text-foreground inline-flex min-h-6 min-w-6 items-center justify-center rounded-sm text-[11px] leading-4 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              href={`#source-${sourceRecord.id}`}
            >
              [{number}]
            </a>
          </sup>
        );
      })}
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
          Custom Setup includes installation, your domain, a 1-hour consultation
          and 1 year of Bordfeed Pro.
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
    <ul className="text-muted-foreground flex flex-col gap-3 text-[14px] leading-[21px]">
      {claims.map((claim) => (
        <li className="flex gap-2.5" key={claim.text}>
          <span aria-hidden="true" className="text-subtle">
            •
          </span>
          <span>
            <ClaimText claim={claim} page={page} />
          </span>
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
              Stay on WP Job Manager when
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
              Bordful fits better when
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
            Know before you switch
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
    <section
      aria-label={caption}
      className="border-line max-w-full overflow-x-auto rounded-lg border"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the table region.
      tabIndex={0}
    >
      <table className="w-full min-w-[760px] border-collapse text-left text-[13px] leading-5">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-secondary">
          <tr>
            <th
              className="border-line w-[160px] border-b px-4 py-3 font-medium"
              scope="col"
            >
              <span className="sr-only">Category</span>
            </th>
            <th
              className="text-foreground border-line w-[300px] border-b px-4 py-3 font-medium"
              scope="col"
            >
              WP Job Manager
            </th>
            <th
              className="text-foreground border-line w-[300px] border-b px-4 py-3 font-medium"
              scope="col"
            >
              Bordful
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="align-top" key={row.label}>
              <th
                className="text-foreground border-line border-b px-4 py-3 font-medium"
                scope="row"
              >
                {row.label}
              </th>
              <td className="text-muted-foreground border-line border-b px-4 py-3 last:border-b-0">
                <ClaimText claim={row.competitor} page={page} />
              </td>
              <td className="text-muted-foreground border-line border-b px-4 py-3 last:border-b-0">
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
          title="Moving from WP Job Manager"
          titleMuted="takes a little work."
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
              What moves
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
              What stays behind
            </h3>
            <ClaimList claims={page.migration.staysBehind} page={page} />
          </section>
        </div>
        <section aria-labelledby="path-heading" className="flex flex-col gap-4">
          <h3
            className="text-foreground text-[17px] leading-6 font-medium"
            id="path-heading"
          >
            A typical path
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
        <SectionHeader title="Sources" />
        <p className="text-subtle text-[12px] leading-[18px]">
          Facts last checked: {checkedOn}, Europe/Madrid.
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
            title="WP Job Manager and Bordful"
            titleMuted="compared."
          />
          <ComparisonTable
            caption="WP Job Manager and Bordful compared"
            page={page}
            rows={page.comparison}
          />
          <p className="text-subtle text-[12px] leading-[18px]">
            Sources for every cell are listed at the bottom of this page. Facts
            last checked {checkedOn}.
          </p>
        </Container>
      </Section>
      <Section>
        <Container className="flex flex-col gap-5">
          <SectionHeader title="Pricing" titleMuted="compared." />
          <ComparisonTable
            caption="Pricing compared"
            page={page}
            rows={page.pricing}
          />
          <p className="text-subtle text-[12px] leading-[18px]">
            Prices in US dollars as published on each site on {checkedOn}.
          </p>
        </Container>
      </Section>
      <Migration page={page} />
      <Section>
        <Container className="flex flex-col gap-5">
          <SectionHeader
            description="Answers based on the product details above."
            title="Frequently asked"
            titleMuted="questions."
          />
          <QuestionList className="md:max-w-[900px]" items={page.faq} />
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
        description="Deploy the free template, or let us set it up for $999 once, with 1 year of Bordfeed Pro included."
        title="Want a job board"
        titleMuted="you fully own?"
      />
      <Sources checkedOn={checkedOn} sources={page.sources} />
      <MarketingSlimFooter />
    </>
  );
}
