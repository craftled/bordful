import type { Metadata } from "next";

import { changelogEntries } from "@/components/marketing/changelog-entries";
import { Container } from "@/components/marketing/container";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description: "What changed in Bordful.",
  title: "Changelog",
};

export default function ChangelogPage() {
  assertMarketingEnabled();

  return (
    <Section className="pt-24 md:pt-32">
      <Container>
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            description="Releases of the open-source template. The current beta stays marked Beta until launch day."
            headingLevel="h1"
            title="Changelog"
          />
          <ol className="mt-16 space-y-12">
            {changelogEntries.map((entry) => (
              <li className="space-y-3" key={entry.version}>
                <h2 className="font-medium text-xl">
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
                <p className="text-muted-foreground text-sm">
                  {entry.date ?? "Beta"}
                </p>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground text-sm">
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
