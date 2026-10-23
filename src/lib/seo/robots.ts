import type { MetadataRoute } from "next";

export function buildRobots(siteUrl: string): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/admin", "/api", "/jobs/search"],
      userAgent: "*",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
