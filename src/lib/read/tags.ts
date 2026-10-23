export const READ_TAGS = {
  bordfeedConnection: "bordfeed-connection",
  companies: "companies",
  jobs: "jobs",
  siteSettings: "site-settings",
} as const;

export function jobTag(slug: string): string {
  return `job:${slug}`;
}

export function companyTag(slug: string): string {
  return `company:${slug}`;
}
