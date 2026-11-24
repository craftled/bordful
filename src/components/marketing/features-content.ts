// Copy for the /features marketing page. Pure data, shared with the
// agent-readable markdown version of the page (src/lib/docs/agent-pages.ts),
// so the React page and the generated markdown cannot drift.

export const FEATURES_PAGE_HERO = {
  eyebrow: "Features",
  heading: ["Everything you need", "to run a job board."],
  lede: "An open-source job board with the pieces already wired together.",
  links: {
    clone: "Clone now",
    demo: "Live demo",
  },
} as const;

// Paper's stats strip, with facts the site already states: the license, the
// 1.0 release on Payload and Postgres, and "live in two minutes" from the
// home hero. Paper's "100% TypeScript" and "5 min" cells are not claims the
// site makes, so they are swapped for these.
export const FEATURES_PAGE_STATS = [
  { label: "Open source license", value: "MIT" },
  { label: "Now on Payload and Postgres", value: "1.0" },
  { label: "From Deploy to a live board", value: "2 min" },
] as const;

// The grid section heading, rendered above FEATURES_PAGE_ITEMS.
export const FEATURES_GRID_HEADER = {
  heading: ["Built for", "job boards."],
  lede: "Every part of the template, as it works in the app today.",
} as const;

// The closing CTA band on /features.
export const FEATURES_PAGE_CTA = {
  description: "Clone the repository and launch your board today.",
  heading: ["Ready to launch your", "job board?"],
} as const;
