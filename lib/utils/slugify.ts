export function slugify(text: string | null | undefined): string {
  // Handle null, undefined, or empty values
  if (!text) {
    return '';
  }

  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w-]+/g, '') // Remove all non-word characters
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function generateJobSlug(
  title: string | null | undefined,
  company: string | null | undefined
): string {
  const titleSlug = slugify(title);
  const companySlug = slugify(company);

  // Handle cases where either title or company is missing
  if (!(titleSlug || companySlug)) {
    return 'job'; // Fallback for completely missing data
  }
  if (!titleSlug) {
    return companySlug;
  }
  if (!companySlug) {
    return titleSlug;
  }

  return `${titleSlug}-at-${companySlug}`;
}
