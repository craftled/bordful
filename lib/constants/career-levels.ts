import type { CareerLevel } from '@/lib/db/airtable';

export const CAREER_LEVEL_DISPLAY_NAMES: Record<CareerLevel, string> = {
  Internship: 'Internship',
  EntryLevel: 'Entry Level',
  Associate: 'Associate',
  Junior: 'Junior',
  MidLevel: 'Mid Level',
  Senior: 'Senior',
  Staff: 'Staff',
  Principal: 'Principal',
  Lead: 'Lead',
  Manager: 'Manager',
  SeniorManager: 'Senior Manager',
  Director: 'Director',
  SeniorDirector: 'Senior Director',
  VP: 'VP',
  SVP: 'SVP',
  EVP: 'EVP',
  CLevel: 'C-Level',
  Founder: 'Founder',
  NotSpecified: 'Not Specified',
} as const;
