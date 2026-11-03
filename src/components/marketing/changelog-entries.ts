export interface ChangelogEntry {
  bullets: readonly string[];
  date: string | null;
  href?: string;
  title: string;
  version: string;
}

export function changelogDateLabel(entry: ChangelogEntry): string {
  if (entry.date) {
    return entry.date;
  }

  return "Legacy";
}

export const changelogEntries: readonly ChangelogEntry[] = [
  {
    bullets: [
      "Payload 4 and Postgres.",
      "Sample jobs from Bordfeed on a fresh deploy, and Connect Bordfeed for your own feed.",
      "Post a Job through a Stripe payment link.",
      "Email job alerts through Resend, weekly or daily.",
      "RSS and JSON feeds, and JobPosting JSON-LD.",
      "Deploy to Vercel.",
      "Runs on Node.js 26 LTS.",
    ],
    date: "2026-11-03",
    title: "1.0.0",
    version: "1.0.0",
  },
  {
    bullets: ["The previous edition stays on the airtable branch."],
    date: null,
    href: "https://github.com/craftled/bordful/tree/airtable",
    title: "0.1.x (Airtable edition)",
    version: "0.1.x",
  },
];
