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
