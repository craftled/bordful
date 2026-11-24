// Copy for the marketing home page sections. Pure data, shared with the
// agent-readable markdown version of the page (src/lib/docs/agent-pages.ts),
// so the React page and the generated markdown cannot drift.

export const HOME_HERO = {
  badge: {
    desktop: "Now on Payload and Postgres",
    phone: "New · Payload and Postgres",
  },
  heading: ["The job board you own.", "Live in two minutes."],
  lede: "An open-source template that deploys with real jobs already listed. Brand it, take paid posts and send alerts on your own domain.",
  links: {
    deploy: "Deploy to Vercel",
    demo: "Live demo",
  },
  release: "1.0",
} as const;

export const HOME_STACK_TAGS = [
  "MIT",
  "Next.js",
  "Payload",
  "Postgres",
] as const;

// The pieces the 1.0 template is built on or wires up. Payload, Stripe and
// Resend have no logo file in this repo, so they get a lettermark.
export const HOME_TECH_STACK = {
  heading: "Built with a modern stack",
  builtOnLabel: "Built on",
  items: [
    { invert: true, name: "Next.js", src: "/marketing/logos/nextjs.svg" },
    { invert: false, name: "Payload", src: null },
    { invert: false, name: "Postgres", src: "/marketing/logos/postgresql.svg" },
    { invert: true, name: "Vercel", src: "/marketing/logos/vercel.svg" },
    {
      invert: true,
      name: "Tailwind CSS",
      src: "/marketing/logos/tailwindcss.svg",
    },
    { invert: true, name: "shadcn/ui", src: "/marketing/logos/shadcn.svg" },
    { invert: false, name: "Stripe", src: null },
    { invert: false, name: "Resend", src: null },
  ],
} as const;

// One sentence for what the board does, built from the feature list:
// Bordfeed jobs, Resend alerts and Stripe paid posts.
export const HOME_STATEMENT = [
  { highlight: false, text: "Bordful" },
  { highlight: true, text: "lists" },
  { highlight: false, text: "jobs from your feed," },
  { highlight: true, text: "alerts" },
  { highlight: false, text: "people when new ones land, and" },
  { highlight: true, text: "charges" },
  { highlight: false, text: "employers to post." },
] as const;

// Every line here is something the app does today: URL-driven filters, a page
// per job with a pinned mobile Apply bar, Resend alerts and browser-local saved
// jobs, the Stripe payment link with a listing duration, and Site settings.
export const HOME_WALKTHROUGH = {
  eyebrow: "Product",
  heading: "Built for the people reading it",
  steps: [
    {
      description:
        "Search, then filter by type, level, salary, language, remote and visa sponsorship. Every view has its own URL.",
      id: "browse",
      label: "Browse and filter",
    },
    {
      description:
        "Each job opens on its own page. On a phone, Apply stays pinned.",
      id: "read",
      label: "Read a role",
    },
    {
      description:
        "Visitors sign up for a daily or weekly email of new jobs, sent through Resend. Saved jobs stay in their browser.",
      id: "alerts",
      label: "Come back with alerts",
    },
    {
      description:
        "Employers pay through your Stripe payment link. You publish the job and it expires after the days you set.",
      id: "paid",
      label: "Take paid posts",
    },
    {
      description:
        "Name, logo, colors, fonts and radius come from Site settings, in light and dark.",
      id: "brand",
      label: "Make it yours",
    },
  ],
} as const;

// The real path from the deploy button to a paying board: the Vercel clone
// provisions Postgres, a fresh install shows the Bordfeed sample feed, Site
// settings carry the brand, and Post a Job is a Stripe payment link.
export const HOME_TIMELINE = {
  eyebrow: "How it works",
  heading: ["From zero to a live board.", "Before your coffee cools."],
  steps: [
    {
      body: "One click to Vercel. Postgres and the admin come with it.",
      title: "Deploy",
      when: "Minute 0",
    },
    {
      body: "Sample jobs from Bordfeed fill it, so it never looks empty.",
      title: "Board is live",
      when: "Minute 2",
    },
    {
      body: "Logo, colors and fonts in Site settings. Turn on alerts with Resend.",
      title: "Make it yours",
      when: "Day 1",
    },
    {
      body: "Connect your Bordfeed feed, or add a Stripe link and take paid posts.",
      title: "Open for business",
      when: "Week 1",
    },
  ],
} as const;

// A trimmed JobPosting in the shape lib/seo/job-posting.ts emits for a remote
// job with a salary, cut to the keys (and salary bounds) that fit the card. The
// values are an example listing.
export const HOME_JOB_POSTING_CODE = [
  "{",
  '  "@type": "JobPosting",',
  '  "title": "Senior Product Designer",',
  '  "hiringOrganization": { "name": "Example Co" },',
  '  "jobLocationType": "TELECOMMUTE",',
  '  "baseSalary": { "minValue": 150000, "maxValue": 190000 }',
  "}",
].join("\n");

// Post a Job values: the price label is display text the owner types (the
// docs use $99), and durationDays defaults to 30 in Site settings. The fake
// checkout strip in the paid card is decorative mock UI, marked
// data-markdown-ignore, so these strings ride along with it.
export const HOME_BENTO_EXAMPLE = {
  continue: "Continue to Stripe",
  durationDays: 30,
  paidThrough: "Paid through Stripe",
  priceLabel: "$99",
  priceName: "Price",
  listedFor: "Listed for",
  note: "Example price. You set your own.",
  thenExpires: "Then it expires",
} as const;

// The four cards' copy, shared by the phone list and the desktop bento.
export const HOME_BENTO = {
  eyebrow: "Features",
  heading: ["Everything a board needs.", "Nothing it does not."],
  cards: {
    alerts: {
      description: "Visitors sign up for a daily or weekly email of new jobs.",
      title: "Visitors come back on their own",
    },
    brand: {
      description: "Neutral by default, so every board looks like its owner.",
      title: "Your colors, not ours",
    },
    paid: {
      description: "Your Stripe payment link. Listings expire on their own.",
      title: "Employers pay to post",
    },
    seo: {
      description: "JobPosting data, sitemaps and a clean URL per job.",
      title: "Found on Google from day one",
    },
  },
  phoneOrder: ["alerts", "brand", "seo", "paid"],
} as const;

export const HOME_FINAL_CTA = {
  heading: ["Launch your board.", "Make it yours later."],
  links: {
    deploy: "Deploy to Vercel",
    github: "Star on GitHub",
    clone: "Clone now",
    demo: "Live demo",
  },
  phoneLede: "Deploy free. Change everything after.",
} as const;
