export const JOB_ORIGINS = [
  "manual",
  "paid",
  "bordfeed",
  "bordfeed_sample",
] as const;
export type JobOrigin = (typeof JOB_ORIGINS)[number];

export const SYNC_OWNED_ORIGINS = [
  "bordfeed",
  "bordfeed_sample",
] as const satisfies readonly JobOrigin[];

export const JOB_EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "temporary",
  "internship",
  "volunteer",
  "per-diem",
  "other",
] as const;
export type JobEmploymentType = (typeof JOB_EMPLOYMENT_TYPES)[number];

export const JOB_WORKPLACE_TYPES = ["onsite", "hybrid", "remote"] as const;
export type JobWorkplaceType = (typeof JOB_WORKPLACE_TYPES)[number];

export const CAREER_LEVELS = [
  "Internship",
  "Entry",
  "Junior",
  "Mid",
  "Senior",
  "Lead",
  "Manager",
  "Director",
  "VP",
  "C-Level",
  "Founder",
] as const;
export type JobCareerLevel = (typeof CAREER_LEVELS)[number];

export const SENIORITIES = [
  "intern",
  "entry",
  "mid",
  "senior",
  "lead",
  "principal",
  "director",
  "vp",
  "c_level",
] as const;
export type JobSeniority = (typeof SENIORITIES)[number];

export const SALARY_BAND_IDS = [
  "< $50K",
  "$50K - $100K",
  "$100K - $200K",
  "> $200K",
] as const;
export type SalaryBandId = (typeof SALARY_BAND_IDS)[number];

export const ALERT_SUBSCRIBER_STATUSES = [
  "pending",
  "active",
  "unsubscribed",
  "bounced",
] as const;
export type AlertSubscriberStatus = (typeof ALERT_SUBSCRIBER_STATUSES)[number];

export const ALERT_FREQUENCIES = ["weekly", "daily"] as const;
export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

export const USER_ROLES = ["admin", "editor"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface JobAlertQuery {
  languages: string[];
  remote: boolean;
  salary: SalaryBandId[];
  seniority: JobSeniority[];
  types: JobEmploymentType[];
  visa: boolean;
}

export const EMPTY_JOB_ALERT_QUERY: JobAlertQuery = {
  languages: [],
  remote: false,
  salary: [],
  seniority: [],
  types: [],
  visa: false,
};

export const JOB_EMPLOYMENT_LABELS: Record<JobEmploymentType, string> = {
  contract: "Contract",
  "full-time": "Full-time",
  internship: "Internship",
  other: "Other",
  "part-time": "Part-time",
  "per-diem": "Per diem",
  temporary: "Temporary",
  volunteer: "Volunteer",
};

export const JOB_WORKPLACE_LABELS: Record<JobWorkplaceType, string> = {
  hybrid: "Hybrid",
  onsite: "Onsite",
  remote: "Remote",
};
