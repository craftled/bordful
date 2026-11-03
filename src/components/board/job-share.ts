export interface ShareLinks {
  email: string;
  linkedin: string;
  x: string;
}

/** Share links for a job, built from its canonical URL. */
export function buildShareLinks(url: string, title: string): ShareLinks {
  const encodedUrl = encodeURIComponent(url);
  return {
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    x: `https://x.com/intent/post?url=${encodedUrl}&text=${encodeURIComponent(title)}`,
  };
}
