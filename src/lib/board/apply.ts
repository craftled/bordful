const UNSAFE_EMAIL_RE = /[\s"<>]/;

function httpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

export function jobApplyHref(job: {
  applyEmail: string | null;
  applyUrl: string | null;
}): string | null {
  const url = job.applyUrl?.trim() ?? "";
  if (url.length > 0) {
    return httpUrl(url);
  }

  const email = job.applyEmail?.trim() ?? "";
  if (email.length === 0 || UNSAFE_EMAIL_RE.test(email)) {
    return null;
  }

  return `mailto:${email}`;
}
