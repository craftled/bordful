// Property names from components.schemas.Job in the pinned Bordfeed OpenAPI.
export const JOB_PROPERTIES = [
  "id",
  "created_at",
  "updated_at",
  "title",
  "company",
  "type",
  "description",
  "listing_url",
  "apply_url",
  "apply_method",
  "apply_email",
  "apply_type",
  "posted_date",
  "status",
  "external_id",
  "content_hash",
  "slug",
  "canonical_job_id",
  "first_visible_at",
  "last_seen_at",
  "closed_at",
  "closed_reason",
  "reposted_at",
  "repost_count",
  "salary_min",
  "salary_max",
  "salary_currency",
  "salary_unit",
  "salary_min_usd",
  "salary_max_usd",
  "workplace_type",
  "remote_region",
  "eligible_countries",
  "timezone_requirements",
  "workplace_city",
  "workplace_region",
  "workplace_country",
  "workplace_country_code",
  "workplace_lat",
  "workplace_lng",
  "workplace_geo_precision",
  "benefits",
  "application_requirements",
  "valid_through",
  "job_identifier",
  "job_source_name",
  "department",
  "travel_required",
  "career_level",
  "visa_sponsorship",
  "languages",
  "skills",
  "qualifications",
  "education_requirements",
  "experience_requirements",
  "responsibilities",
  "featured",
  "industry",
  "occupational_category",
  "quality_flags",
  "summary",
  "benefit_tags",
  "education_level",
  "experience_years_min",
  "experience_years_max",
  "application_requirement_tags",
  "timezone_min_offset",
  "timezone_max_offset",
  "tools",
  "salary_note",
  "title_normalized",
  "role_family",
  "management_scope",
  "contract_duration_months",
  "hours_per_week",
  "schedule",
  "security_clearance",
  "relocation_assistance",
  "equity_offered",
  "certifications",
  "interview_process",
  "start_date",
  "hiring_urgency",
  "locations",
  "source_updated_at",
  "language",
  "enrichment",
  "relevance_score",
  "highlights",
  "similarity_score",
  "html_snippet",
  "description_html",
] as const;

export interface MockCompany {
  domain: string | null;
  id: string;
  logo_url: string | null;
  name: string;
  slug: string | null;
}

export type MockJob = Record<(typeof JOB_PROPERTIES)[number], unknown>;

const COMPANIES = [
  {
    domain: "example.com",
    name: "Example Co",
    slug: "example-co",
  },
  {
    domain: "acme.example",
    name: "Acme Example Ltd",
    slug: "acme-example-ltd",
  },
  {
    domain: "widgets.example",
    name: "Sample Widgets Inc",
    slug: "sample-widgets-inc",
  },
] as const;

const COUNTRIES = ["US", "DE", "GB", "FR", "CA"] as const;
const WORKPLACES = ["Remote", "Hybrid", "On-site"] as const;

export function uuid(group: number, index: number): string {
  const head = group.toString(16).padStart(8, "0");
  const tail = index.toString(16).padStart(12, "0");
  return `${head}-0000-4000-8000-${tail}`;
}

function emptyJob(): MockJob {
  const job = {} as MockJob;
  for (const key of JOB_PROPERTIES) {
    job[key] = null;
  }
  return job;
}

export function buildMockJob(input: {
  countryCode?: string;
  descriptionHtml: string | null;
  employmentType?: string;
  idGroup?: number;
  index: number;
  title: string;
  workplaceType?: string;
}): MockJob {
  const companyIndex = (input.index - 1) % COMPANIES.length;
  const companySource = COMPANIES[companyIndex] ?? COMPANIES[0];
  const country =
    input.countryCode ??
    COUNTRIES[(input.index - 1) % COUNTRIES.length] ??
    "US";
  const workplace =
    input.workplaceType ??
    WORKPLACES[(input.index - 1) % WORKPLACES.length] ??
    "Remote";
  const employment = input.employmentType ?? "Full-time";
  const idGroup = input.idGroup ?? 1;
  const slug = input.title.toLowerCase().replaceAll(" ", "-");
  const stamped = "2026-10-01T00:00:00.000Z";
  const company: MockCompany = {
    domain: companySource.domain,
    id: uuid(idGroup + 1, input.index),
    logo_url: null,
    name: companySource.name,
    slug: companySource.slug,
  };
  const job = emptyJob();
  job.id = uuid(idGroup, input.index);
  job.created_at = stamped;
  job.updated_at = stamped;
  job.title = input.title;
  job.company = company;
  job.type = employment;
  job.description = `Example description for ${input.title}.`;
  job.apply_url = `https://apply.example/${slug}`;
  job.apply_method = "link";
  job.posted_date = stamped;
  job.status = "active";
  job.slug = slug;
  job.first_visible_at = stamped;
  job.workplace_type = workplace;
  job.workplace_country_code = country;
  job.career_level = ["Mid"];
  job.languages = ["en"];
  job.occupational_category = "Software";
  job.role_family = "engineering";
  job.locations = [`Example City, ${country}`];
  job.language = "en";
  job.description_html = input.descriptionHtml;
  return job;
}
