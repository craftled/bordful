// Copy for the /showcase marketing page and the home showcase section. Pure
// data, shared with the agent-readable markdown version of the page
// (src/lib/docs/agent-pages.ts), so the React page and the generated
// markdown cannot drift.

export const SHOWCASE_PAGE_HEADER = {
  description:
    "The live Bordful demo. Community boards show up here after they opt in.",
  eyebrow: "Showcase",
  heading: ["Job boards", "built with Bordful."],
} as const;

export const SHOWCASE_SECTION_HEADER = {
  description: "Community installs that opt in will join this list.",
  eyebrow: "Showcase",
  heading: ["Built with Bordful.", "The live demo board."],
  link: "View the showcase",
} as const;

export const SHOWCASE_GROUPS = {
  community: "Community boards",
  empty: "No community boards are listed yet.",
} as const;

export const SHOWCASE_PAGE_CTA = {
  description:
    'Turn on "List my board" in Site settings, Showcase, and open an issue at GitHub.',
  heading: ["Built a board", "with Bordful?"],
} as const;
