export interface NavItem {
  href: string;
  id: string;
  label: string;
}

export interface FooterColumn {
  id: string;
  items: NavItem[];
  title: string;
}

export function boardHomePath(marketing: boolean): string {
  return marketing ? "/jobs" : "/";
}

const POST_JOB: NavItem = { href: "/post", id: "post", label: "Post a job" };

const FEED_LINKS: NavItem[] = [
  { href: "/feed.xml", id: "feed-rss", label: "RSS" },
  { href: "/atom.xml", id: "feed-atom", label: "Atom" },
  { href: "/feed.json", id: "feed-json", label: "JSON" },
];

export function getNav({
  marketing,
  postJobEnabled,
  alertsEnabled,
}: {
  marketing: boolean;
  postJobEnabled: boolean;
  alertsEnabled: boolean;
}): {
  cta: NavItem | null;
  footer: NavItem[];
  footerColumns: FooterColumn[];
  header: NavItem[];
} {
  const cta = postJobEnabled ? POST_JOB : null;

  if (marketing) {
    return {
      cta,
      footer: [
        { href: "/about", id: "about", label: "About" },
        { href: "/privacy", id: "privacy", label: "Privacy" },
        { href: "/terms", id: "terms", label: "Terms" },
        { href: "/feed.xml", id: "feed", label: "RSS" },
      ],
      footerColumns: [
        {
          id: "jobs",
          items: [
            { href: "/jobs", id: "all-jobs", label: "All jobs" },
            { href: "/companies", id: "companies", label: "Companies" },
          ],
          title: "Jobs",
        },
        {
          id: "feeds",
          items: FEED_LINKS,
          title: "Job feeds",
        },
        {
          id: "company",
          items: [
            { href: "/about", id: "about", label: "About" },
            { href: "/pricing", id: "pricing", label: "Pricing" },
            { href: "/changelog", id: "changelog", label: "Changelog" },
          ],
          title: "Company",
        },
        {
          id: "legal",
          items: [
            { href: "/privacy", id: "privacy", label: "Privacy" },
            { href: "/terms", id: "terms", label: "Terms" },
          ],
          title: "Legal",
        },
      ],
      header: [
        { href: "/jobs", id: "jobs", label: "Jobs" },
        { href: "/pricing", id: "pricing", label: "Pricing" },
        { href: "/showcase", id: "showcase", label: "Showcase" },
        { href: "/changelog", id: "changelog", label: "Changelog" },
      ],
    };
  }

  const header: NavItem[] = [
    { href: "/", id: "jobs", label: "Jobs" },
    { href: "/companies", id: "companies", label: "Companies" },
  ];

  if (alertsEnabled) {
    header.push({ href: "/alerts", id: "alerts", label: "Job alerts" });
  }

  // Taxonomy browsing lives on the /jobs hub in board-only mode.
  return {
    cta,
    footer: [{ href: "/feed.xml", id: "feed", label: "RSS" }],
    footerColumns: [
      {
        id: "jobs",
        items: [
          { href: "/", id: "all-jobs", label: "All jobs" },
          { href: "/jobs#job-types", id: "job-types", label: "Job types" },
          { href: "/jobs#locations", id: "locations", label: "Locations" },
          { href: "/jobs#levels", id: "levels", label: "Levels" },
          { href: "/jobs#languages", id: "languages", label: "Languages" },
          { href: "/companies", id: "companies", label: "Companies" },
        ],
        title: "Jobs",
      },
      {
        id: "feeds",
        items: FEED_LINKS,
        title: "Job feeds",
      },
    ],
    header,
  };
}
