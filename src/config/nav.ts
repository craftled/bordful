export interface NavItem {
  href: string;
  id: string;
  label: string;
}

export function boardHomePath(marketing: boolean): string {
  return marketing ? "/jobs" : "/";
}

export function getNav({
  marketing,
  postJobEnabled,
  alertsEnabled,
}: {
  marketing: boolean;
  postJobEnabled: boolean;
  alertsEnabled: boolean;
}): { header: NavItem[]; footer: NavItem[] } {
  if (marketing) {
    return {
      footer: [
        { href: "/about", id: "about", label: "About" },
        { href: "/privacy", id: "privacy", label: "Privacy" },
        { href: "/terms", id: "terms", label: "Terms" },
        { href: "/feed.xml", id: "feed", label: "RSS" },
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

  if (postJobEnabled) {
    header.push({ href: "/post", id: "post", label: "Post a job" });
  }

  return {
    footer: [{ href: "/feed.xml", id: "feed", label: "RSS" }],
    header,
  };
}
