import type { BordfeedCompanyEmbed } from "./job-schema";

const HOSTNAME = /^[a-z0-9.-]+\.[a-z]{2,}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface MappedCompany {
  bordfeedCompanyId: string | null;
  domain: string | null;
  logoUrl: string | null;
  name: string;
  slug: string;
}

function trimToNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .replaceAll(/-{2,}/g, "-");
}

export function httpUrl(value: string | null | undefined): string | null {
  const raw = trimToNull(value);
  if (!raw) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
}

export function normalizeDomain(
  value: string | null | undefined
): string | null {
  const raw = trimToNull(value);
  if (!raw) {
    return null;
  }

  const host = raw.includes("://")
    ? (() => {
        try {
          return new URL(raw).hostname;
        } catch {
          return raw;
        }
      })()
    : raw;
  const normalized = host.trim().toLowerCase().replaceAll(/\.$/g, "");
  return HOSTNAME.test(normalized) ? normalized : null;
}

export function companyKey(company: MappedCompany | null): string | null {
  if (!company) {
    return null;
  }

  if (company.bordfeedCompanyId) {
    return `id:${company.bordfeedCompanyId}`;
  }

  if (company.domain) {
    return `domain:${company.domain}`;
  }

  return `name:${company.name}`;
}

export function mapBordfeedCompany(
  embed: BordfeedCompanyEmbed | null | undefined
): MappedCompany | null {
  if (!embed) {
    return null;
  }

  const name = trimToNull(embed.name);
  if (!name) {
    return null;
  }

  const rawSlug = trimToNull(embed.slug);
  const slug = rawSlug && SLUG.test(rawSlug) ? rawSlug : slugify(name);

  return {
    bordfeedCompanyId: trimToNull(embed.id),
    domain: normalizeDomain(embed.domain),
    logoUrl: httpUrl(embed.logo_url),
    name,
    slug: slug.length > 0 ? slug : "company",
  };
}
