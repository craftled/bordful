import type { Metadata } from "next";

import {
  changelogDateLabel,
  changelogEntries,
} from "@/components/marketing/changelog-entries";
import { Container } from "@/components/marketing/container";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description: "What changed in Bordful.",
  title: "Changelog",
};

export default function ChangelogPage() {
  assertMarketingEnabled();

  return (
    <Container className="md:px-10">
      <div className="mx-auto flex w-full max-w-[1072px] flex-col gap-8 pt-7 pb-[72px]">
        <p className="text-[13px] leading-4">
          <span className="text-subtle">Bordful / </span>
          <span className="text-foreground">Changelog</span>
        </p>
        <h1 className="flex flex-col text-[30px] leading-[40px] font-medium tracking-[-0.035em] sm:text-[40px] sm:leading-[48px]">
          <span className="text-foreground">Changelog.</span>
          <span className="text-subtle">
            Releases of the open-source template.
          </span>
        </h1>
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
                    <span aria-hidden="true" className="text-subtle">
                      •
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </Container>
  );
}
