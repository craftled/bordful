import type { Alternative, IsoDate } from "./types";
import { wpJobManager } from "./wp-job-manager";

export const ALTERNATIVES = [
  wpJobManager,
] as const satisfies readonly Alternative[];

export const ALTERNATIVE_SLUGS = ALTERNATIVES.map((page) => page.slug);

export const ALTERNATIVES_HUB = {
  metaTitle: "Alternatives and Comparisons",
  metaDescription:
    "Fair, sourced comparisons between Bordful and other job board software, starting with WP Job Manager.",
  heading: {
    title: "Job board software,",
    titleMuted: "compared fairly.",
  },
  intro:
    "Bordful is a free, MIT-licensed job board template on Next.js, Payload and Postgres. You host it, you own the code and the data, and a fresh deploy starts with sample jobs. Each comparison says when the other tool is the better choice and cites a source and a check date for every fact.",
} as const;

// The closing CTA bands and the shared section labels of the alternative
// pages. Exported so the React pages and the agent markdown version
// (src/lib/docs/agent-pages.ts) render the same strings.
export const ALTERNATIVES_HUB_CTA = {
  description:
    "Deploy the free template, or let us set it up for $999 once, with 1 year of Bordfeed Pro included.",
  title: "Ready to own",
  titleMuted: "your job board?",
} as const;

export const ALTERNATIVES_PAGE_CTA = {
  description:
    "Deploy the free template, or let us set it up for $999 once, with 1 year of Bordfeed Pro included.",
  title: "Want a job board",
  titleMuted: "you fully own?",
} as const;

export const ALTERNATIVES_CUSTOM_SETUP_NOTE =
  "Custom Setup includes installation, your domain, a 1-hour consultation and 1 year of Bordfeed Pro.";

// The fixed labels of an alternative page. Headings that name the tool
// (`${name} and Bordful`, `Stay on ${name} when`, `Moving from ${name}`)
// are composed from these and page.name by both the React page and the
// agent markdown version (src/lib/docs/agent-pages.ts).
export const ALTERNATIVES_PAGE_LABELS = {
  compared: "compared.",
  factsChecked: "Facts last checked:",
  factsCheckedSuffix: ", Europe/Madrid.",
  faqDescription: "Answers based on the product details above.",
  faqTitle: "Frequently asked",
  faqTitleMuted: "questions.",
  limits: "Know before you switch",
  migrationTitleMuted: "takes a little work.",
  moves: "What moves",
  path: "A typical path",
  pricesNote: "Prices in US dollars as published on each site on",
  sources: "Sources",
  sourcesNote:
    "Sources for every cell are listed at the bottom of this page. Facts last checked",
  stayPrefix: "Stay on",
  staySuffix: "when",
  staysBehind: "What stays behind",
  switch: "Bordful fits better when",
  tableBordful: "Bordful",
  tableCategory: "Category",
} as const;

export function getAlternative(slug: string): Alternative | undefined {
  return ALTERNATIVES.find((page) => page.slug === slug);
}

export function factsCheckedOn(page: Alternative): IsoDate {
  const dates = page.sources.map((source) => source.checkedOn);
  let oldest = dates[0] ?? "1970-01-01";

  for (const checkedOn of dates) {
    if (checkedOn < oldest) {
      oldest = checkedOn;
    }
  }

  return oldest;
}

export function formatCheckedOn(iso: IsoDate): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)));
}

export function staleSources(
  page: Alternative,
  now: Date
): Alternative["sources"][number][] {
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );

  return page.sources.filter((source) => {
    const [year, month, day] = source.checkedOn.split("-").map(Number);
    const checked = Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1);
    return today - checked > 45 * 24 * 60 * 60 * 1000;
  });
}
