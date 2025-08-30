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
  if (diffInSeconds < 60) {
    relativeTime = 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    relativeTime = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86_400) {
    const hours = Math.floor(diffInSeconds / 3600);
    relativeTime = `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 2_592_000) {
    const days = Math.floor(diffInSeconds / 86_400);
    relativeTime = `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    relativeTime = fullDate;
  }

  return { fullDate, relativeTime };
}
