import {
  SECONDS_PER_MINUTE,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  SECONDS_PER_MONTH,
} from '@/lib/constants/defaults';

export function formatDate(dateString: string | null | undefined) {
  // Handle null, undefined, or empty date strings
  if (!dateString) {
    return {
      fullDate: 'Date not available',
      relativeTime: 'Date not available',
    };
  }

  const date = new Date(dateString);

  // Check if the date is valid
  if (Number.isNaN(date.getTime())) {
    return { fullDate: 'Invalid date', relativeTime: 'Invalid date' };
  }

  // Format full date like "Dec 10, 2024"
  const fullDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Calculate relative time
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let relativeTime;
  if (diffInSeconds < SECONDS_PER_MINUTE) {
    relativeTime = 'just now';
  } else if (diffInSeconds < SECONDS_PER_HOUR) {
    const minutes = Math.floor(diffInSeconds / SECONDS_PER_MINUTE);
    relativeTime = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < SECONDS_PER_DAY) {
    const hours = Math.floor(diffInSeconds / SECONDS_PER_HOUR);
    relativeTime = `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < SECONDS_PER_MONTH) {
    const days = Math.floor(diffInSeconds / SECONDS_PER_DAY);
    relativeTime = `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    relativeTime = fullDate;
  }

  return { fullDate, relativeTime };
}
