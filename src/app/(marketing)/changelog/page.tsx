import type { Metadata } from "next";
import {
  CHANGELOG_PAGE_HEADER,
  changelogDateLabel,
  changelogEntries,
} from "@/components/marketing/changelog-entries";
import { Container } from "@/components/marketing/container";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { assertMarketingEnabled } from "@/config/marketing-guard";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";
import { agentPageDescription } from "@/lib/docs/agent-pages";

export const metadata: Metadata = marketingPageMetadata({
  description: agentPageDescription("/changelog"),
  markdownPath: markdownPathFor("/changelog"),
  path: "/changelog",
  title: "Changelog",
});

export default function ChangelogPage() {
  assertMarketingEnabled();

  return (
    <>
      <Section className="md:py-14">
        <Container>
          <SectionHeader
            description={CHANGELOG_PAGE_HEADER.description}
            eyebrow={CHANGELOG_PAGE_HEADER.eyebrow}
            headingLevel="h1"
            title={CHANGELOG_PAGE_HEADER.heading[0]}
            titleMuted={CHANGELOG_PAGE_HEADER.heading[1]}
          />
        </Container>
      </Section>
      <Section className="md:py-14">
        <Container className="mx-auto max-w-[880px] md:px-10">
          <ol className="flex flex-col gap-4">
            {changelogEntries.map((entry) => (
              <li
                className="bg-card ring-line flex flex-col gap-3 rounded-[14px] p-[22px] ring-1"
                key={entry.version}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-foreground font-mono text-[11px] font-medium tracking-[0.04em]">
                      v{entry.version}
                    </span>
                    <h2 className="text-foreground text-[16px] leading-5 font-medium">
                      {entry.href ? (
                        <a
                          className="underline-offset-4 hover:underline"
                          href={entry.href}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {entry.title}
                        </a>
                      ) : (
                        entry.title
                      )}
                    </h2>
                  </div>
                  <p className="text-subtle text-[13px] leading-4">
                    {changelogDateLabel(entry)}
                  </p>
                </div>
                <ul className="flex flex-col gap-3">
                  {entry.bullets.map((bullet) => (
                    <li
                      className="text-muted-foreground flex gap-2.5 text-[14px] leading-[18px]"
                      key={bullet}
                    >
                      <span
                        aria-hidden="true"
                        className="text-subtle"
                        data-markdown-ignore
                      >
                        •
                      </span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Container>
      </Section>
    </>
  );
}
