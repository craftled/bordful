import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Container } from "./container";
import { MarketingImage } from "./marketing-image";
import { Section } from "./section";
import { SectionHeader } from "./section-header";
import {
  SHOWCASE_COMMUNITY,
  SHOWCASE_DEMO,
  SHOWCASE_TEAM,
  type ShowcaseEntry,
} from "./showcase-entries";
import { SHOWCASE_ISSUE_URL } from "./site";

function ShowcaseCard({
  entry,
  headingLevel,
}: {
  entry: ShowcaseEntry;
  headingLevel: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <a
      className="block overflow-hidden rounded-lg border bg-background/50"
      href={entry.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <MarketingImage
        alt=""
        className="w-full"
        height={1215}
        src={entry.image}
        width={2160}
      />
      <div className="space-y-2 p-5">
        <Heading className="font-medium text-sm">{entry.name}</Heading>
        <p className="text-muted-foreground text-sm">{entry.description}</p>
      </div>
    </a>
  );
}

function EntryGrid({
  entries,
  headingLevel,
}: {
  entries: readonly ShowcaseEntry[];
  headingLevel: "h2" | "h3";
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {entries.map((entry) => (
        <ShowcaseCard
          entry={entry}
          headingLevel={headingLevel}
          key={entry.url}
        />
      ))}
    </div>
  );
}

export function Showcase({
  variant = "section",
}: {
  variant?: "section" | "page";
}) {
  if (variant === "section") {
    return (
      <Section id="showcase" variant="secondary">
        <Container>
          <SectionHeader
            description="The live demo board. Community installs that opt in will join this list."
            title="Built with Bordful"
          />
          <div className="mx-auto mt-12 max-w-xl">
            <ShowcaseCard entry={SHOWCASE_DEMO} headingLevel="h3" />
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild className="rounded-full" variant="outline">
              <Link href="/showcase">View the showcase</Link>
            </Button>
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <div className="space-y-16">
      <ShowcaseCard entry={SHOWCASE_DEMO} headingLevel="h2" />
      <div className="space-y-6">
        <h2 className="font-medium text-xl">Community boards</h2>
        {SHOWCASE_COMMUNITY.length > 0 ? (
          <EntryGrid entries={SHOWCASE_COMMUNITY} headingLevel="h3" />
        ) : (
          <p className="text-muted-foreground text-sm">
            No community boards are listed yet.
          </p>
        )}
      </div>
      {SHOWCASE_TEAM.length > 0 ? (
        <div className="space-y-6">
          <h2 className="font-medium text-xl">
            Built by the team behind Bordful
          </h2>
          <EntryGrid entries={SHOWCASE_TEAM} headingLevel="h3" />
        </div>
      ) : null}
      <div className="space-y-3">
        <h2 className="font-medium text-xl">List your board</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Turn on &quot;List my board&quot; in Site settings, Showcase, and open
          an issue at{" "}
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={SHOWCASE_ISSUE_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </div>
  );
}
