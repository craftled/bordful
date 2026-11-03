import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Container } from "./container";
import { MarketingCta } from "./marketing-cta";
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

// Dark-theme captures for entries we have one for. The demo's thumbnail is
// the board, so dark pages show the dark board shot.
const DARK_IMAGES: Record<string, string> = {
  [SHOWCASE_DEMO.image]: "/marketing/shots/board-dark.png",
};

const thumbClass =
  "bg-surface-sub ring-line h-[150px] w-full rounded-lg object-cover object-top ring-1";

function ShowcaseCard({
  entry,
  headingLevel,
}: {
  entry: ShowcaseEntry;
  headingLevel: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const dark = DARK_IMAGES[entry.image];

  return (
    <a
      className="group bg-card flex flex-col gap-2.5 rounded-[14px] p-4 ring-1 ring-(--shot-ring) ring-inset md:rounded-xl md:p-5"
      href={entry.url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <MarketingImage
        alt=""
        className={cn(thumbClass, dark && "dark:hidden")}
        height={1692}
        src={entry.image}
        width={2880}
      />
      {dark ? (
        <MarketingImage
          alt=""
          className={cn(thumbClass, "hidden dark:block")}
          height={1800}
          loading="lazy"
          src={dark}
          width={2880}
        />
      ) : null}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <Heading className="text-foreground text-[15px] leading-[22px] font-medium">
            {entry.name}
          </Heading>
          <ChevronRight
            aria-hidden="true"
            className="text-subtle group-hover:text-foreground size-3.5 shrink-0"
            strokeWidth={1.6}
          />
        </div>
        <p className="text-muted-foreground text-[13px] leading-[19px]">
          {entry.description}
        </p>
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
    <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
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

function GroupHeading({ children }: { children: string }) {
  return (
    <h2 className="text-foreground text-[18px] leading-6 font-medium tracking-[-0.015em]">
      {children}
    </h2>
  );
}

export function Showcase({
  variant = "section",
}: {
  variant?: "section" | "page";
}) {
  if (variant === "section") {
    return (
      <Section id="showcase">
        <Container className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="flex flex-col gap-6">
            <SectionHeader
              description="Community installs that opt in will join this list."
              eyebrow="Showcase"
              title="Built with Bordful."
              titleMuted="The live demo board."
            />
            <Button asChild className="self-start shadow-xs" variant="outline">
              <Link href="/showcase">View the showcase</Link>
            </Button>
          </div>
          <div className="w-full md:max-w-[520px]">
            <ShowcaseCard entry={SHOWCASE_DEMO} headingLevel="h3" />
          </div>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <Section>
        <Container className="flex flex-col gap-10 md:gap-12">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
            <ShowcaseCard entry={SHOWCASE_DEMO} headingLevel="h2" />
          </div>
          <div className="flex flex-col gap-4">
            <GroupHeading>Community boards</GroupHeading>
            {SHOWCASE_COMMUNITY.length > 0 ? (
              <EntryGrid entries={SHOWCASE_COMMUNITY} headingLevel="h3" />
            ) : (
              <p className="text-muted-foreground bg-surface-sub ring-line rounded-xl px-5 py-8 text-center text-[13px] leading-[19px] ring-1">
                No community boards are listed yet.
              </p>
            )}
          </div>
          {SHOWCASE_TEAM.length > 0 ? (
            <div className="flex flex-col gap-4">
              <GroupHeading>Built by the team behind Bordful</GroupHeading>
              <EntryGrid entries={SHOWCASE_TEAM} headingLevel="h3" />
            </div>
          ) : null}
        </Container>
      </Section>
      <MarketingCta
        actions={[
          { external: true, href: SHOWCASE_ISSUE_URL, label: "Open an issue" },
        ]}
        description={
          <>
            Turn on &quot;List my board&quot; in Site settings, Showcase, and
            open an issue at GitHub.
          </>
        }
        headingLevel="h2"
        title="Built a board"
        titleMuted="with Bordful?"
      />
    </>
  );
}
