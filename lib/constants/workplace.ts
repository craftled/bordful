import type { Country } from './countries';

export type WorkplaceType = 'On-site' | 'Hybrid' | 'Remote' | 'Not specified';

export const workplaceTypes: WorkplaceType[] = [
  'On-site',
  'Hybrid',
  'Remote',
  'Not specified',
] as const;

export type RemoteRegion =
  | 'Worldwide'
  | 'Americas Only'
  | 'Europe Only'
  | 'Asia-Pacific Only'
  | 'US Only'
  | 'EU Only'
  | 'UK/EU Only'
  | 'US/Canada Only'
  | null;

export const remoteRegions: RemoteRegion[] = [
  'Worldwide',
  'Americas Only',
  'Europe Only',
  'Asia-Pacific Only',
  'US Only',
  'EU Only',
  'UK/EU Only',
  'US/Canada Only',
] as const;

export type WorkplaceSettings = {
  workplace_type: WorkplaceType;
  remote_region: RemoteRegion;
  timezone_requirements: string | null;
  workplace_city: string | null;
  workplace_country: Country | null;
};

export type RemoteFriendly = 'Yes' | 'No' | 'Hybrid' | 'Not specified';

export function getRemoteFriendlyStatus(
  settings: Pick<WorkplaceSettings, 'workplace_type'>
): RemoteFriendly {
  switch (settings.workplace_type) {
    case 'Remote':
      return 'Yes';
    case 'Hybrid':
      return 'Hybrid';
    case 'On-site':
      return 'No';
    default:
      return 'Not specified';
  }
}
