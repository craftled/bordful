import type {
  AlertFrequency,
  JobCareerLevel,
  JobEmploymentType,
  JobOrigin,
  JobSeniority,
  JobWorkplaceType,
} from "@/lib/domain/job-vocab";
import type { ThemeTokens } from "@/theme/tokens";

export const PUBLIC_DETAIL_FIELDS = [
  "salary",
  "location",
  "employmentType",
  "workplaceType",
  "careerLevel",
  "languages",
  "categories",
  "validThrough",
] as const;
export type PublicDetailField = (typeof PUBLIC_DETAIL_FIELDS)[number];

export interface JobListItem {
  careerLevel: JobCareerLevel[];
  categories: string[];
  companyLogoUrl: string | null;
  companyName: string;
  companySlug: string | null;
  countryCode: string | null;
  employmentType: JobEmploymentType | null;
  featured: boolean;
  id: string;
  indexable: boolean;
  languages: string[];
  locationDisplay: string | null;
  origin: JobOrigin;
  publishedAt: string | null;
  remoteRegion: string | null;
  salaryCurrency: string | null;
  salaryMax: number | null;
  salaryMaxUsd: number | null;
  salaryMin: number | null;
  salaryMinUsd: number | null;
  seniority: JobSeniority | null;
  slug: string;
  title: string;
  validThrough: string | null;
  visaSponsorship: string | null;
  workplaceType: JobWorkplaceType | null;
}

export interface CompanySummary {
  careersUrl: string | null;
  domain: string | null;
  headcount: number | null;
  id: string;
  industry: string | null;
  linkedinUrl: string | null;
  location: string | null;
  logoUrl: string | null;
  name: string;
  slug: string;
  twitterUrl: string | null;
  website: string | null;
}

export interface JobDetail extends JobListItem {
  applyEmail: string | null;
  applyMethod: string | null;
  applyUrl: string | null;
  company: CompanySummary | null;
  description: unknown;
  locality: string | null;
  region: string | null;
  sourceListingUrl: string | null;
}

export interface CompanyDetail extends CompanySummary {
  description: unknown;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  totalDocs: number;
  totalPages: number;
}

export interface SiteSettingsView {
  alerts: {
    enabled: boolean;
    defaultFrequency: AlertFrequency;
    fromName: string;
    fromEmail: string | null;
  };
  board: {
    title: string;
    description: string;
    jobsPerPage: number;
    publicDetailFields: PublicDetailField[];
  };
  logoUrl: string | null;
  name: string;
  postJob: {
    enabled: boolean;
    paymentLinkUrl: string;
    priceLabel: string;
    durationDays: number;
  };
  showcase: {
    listMyBoard: boolean;
  };
  tagline: string;
  theme: ThemeTokens;
}

export interface BordfeedConnectionPublic {
  lastSyncAt: string | null;
  showAttribution: boolean;
  state: "sample" | "awaiting_code" | "connected" | "error";
  templateId: string;
}
