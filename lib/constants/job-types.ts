import type { Job } from '@/lib/db/airtable';

export type JobType = Job['type'];

export const JOB_TYPE_DISPLAY_NAMES: Record<JobType, string> = {
  'Full-time': 'Full-time',
  'Part-time': 'Part-time',
  Contract: 'Contract',
  Freelance: 'Freelance',
} as const;

export const JOB_TYPE_DESCRIPTIONS: Record<JobType, string> = {
  'Full-time': 'Permanent positions with standard working hours',
  'Part-time': 'Positions with reduced or flexible hours',
  Contract: 'Fixed-term or project-based positions',
  Freelance: 'Self-employed or project-based contractual work',
} as const;
