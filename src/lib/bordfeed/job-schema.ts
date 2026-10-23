import { z } from "zod";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();
const nullableBoolean = z.boolean().nullable().optional();
const stringList = z.array(z.string()).nullable().optional();

export const bordfeedCompanySchema = z.looseObject({
  domain: nullableString,
  id: nullableString,
  logo_url: nullableString,
  name: nullableString,
  slug: nullableString,
});

export const bordfeedJobSchema = z.looseObject({
  application_requirement_tags: stringList,
  application_requirements: nullableString,
  apply_email: nullableString,
  apply_method: nullableString,
  apply_type: nullableString,
  apply_url: nullableString,
  benefit_tags: stringList,
  benefits: nullableString,
  career_level: stringList,
  certifications: stringList,
  company: bordfeedCompanySchema.nullable().optional(),
  contract_duration_months: nullableNumber,
  department: nullableString,
  description: nullableString,
  description_html: nullableString,
  education_level: nullableString,
  education_requirements: nullableString,
  eligible_countries: stringList,
  equity_offered: nullableBoolean,
  experience_requirements: nullableString,
  experience_years_max: nullableNumber,
  experience_years_min: nullableNumber,
  external_id: nullableString,
  featured: nullableBoolean,
  first_visible_at: nullableString,
  hiring_urgency: nullableString,
  hours_per_week: nullableNumber,
  id: z.string().min(1),
  industry: nullableString,
  interview_process: nullableString,
  job_identifier: nullableString,
  job_source_name: nullableString,
  language: nullableString,
  languages: stringList,
  listing_url: nullableString,
  locations: stringList,
  management_scope: nullableString,
  occupational_category: nullableString,
  posted_date: nullableString,
  qualifications: nullableString,
  relocation_assistance: nullableBoolean,
  remote_region: nullableString,
  responsibilities: nullableString,
  role_family: nullableString,
  salary_currency: nullableString,
  salary_max: nullableNumber,
  salary_max_usd: nullableNumber,
  salary_min: nullableNumber,
  salary_min_usd: nullableNumber,
  salary_note: nullableString,
  salary_unit: nullableString,
  schedule: nullableString,
  security_clearance: nullableString,
  skills: stringList,
  slug: nullableString,
  start_date: nullableString,
  summary: nullableString,
  timezone_max_offset: nullableNumber,
  timezone_min_offset: nullableNumber,
  timezone_requirements: nullableString,
  title: nullableString,
  tools: stringList,
  travel_required: nullableBoolean,
  type: nullableString,
  valid_through: nullableString,
  visa_sponsorship: nullableString,
  workplace_city: nullableString,
  workplace_country: nullableString,
  workplace_country_code: nullableString,
  workplace_geo_precision: nullableString,
  workplace_lat: nullableNumber,
  workplace_lng: nullableNumber,
  workplace_region: nullableString,
  workplace_type: nullableString,
});

export type BordfeedJob = z.infer<typeof bordfeedJobSchema>;
export type BordfeedCompanyEmbed = z.infer<typeof bordfeedCompanySchema>;

const templateSchema = z.looseObject({
  category: z.string(),
  description: z.string(),
  filters: z.record(z.string(), z.unknown()),
  id: z.string(),
  name: z.string(),
});

export const templatesResponseSchema = z.looseObject({
  data: z.array(templateSchema),
  request_id: z.string(),
});

const previewTemplateSchema = z.looseObject({
  description: z.string(),
  filters: z.record(z.string(), z.unknown()),
  id: z.string(),
  name: z.string(),
});

export const previewResponseSchema = z.looseObject({
  attribution: z
    .looseObject({
      logo_url: z.string(),
      text: z.string(),
      url: z.string(),
    })
    .optional(),
  data: z.array(bordfeedJobSchema),
  filters_applied: z.looseObject({}).optional(),
  message: z.string(),
  preview: z.literal(true),
  request_id: z.string(),
  template: previewTemplateSchema,
});

export const registerResponseSchema = z.looseObject({
  expires_at: z.string(),
  registration_id: z.string(),
});

export const verifyResponseSchema = z.looseObject({
  api_key: z.string(),
  suggested_feed: z
    .looseObject({
      name: z.string().optional(),
      template_id: z.string().optional(),
    })
    .nullable()
    .optional(),
});

export const feedCreateResponseSchema = z.looseObject({
  data: z.looseObject({
    id: z.string(),
  }),
  request_id: z.string().optional(),
});

export const jobsPageSchema = z.looseObject({
  data: z.array(bordfeedJobSchema),
  pagination: z.looseObject({
    has_more: z.boolean(),
    limit: z.number().optional(),
    next_cursor: z.string().nullable(),
    next_offset: z.number().nullable().optional(),
  }),
  request_id: z.string().optional(),
});
