/**
 * Fetch an image and convert it to a data URI string
 */
export async function fetchImageAsDataURI(
  imageUrl: string,
  baseUrl: string
): Promise<string> {
  try {
    // Handle relative URLs
    const fullUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${baseUrl}${imageUrl}`;

    const response = await fetch(fullUrl);
    if (!response.ok) {
      return '';
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const imageData = await response.arrayBuffer();
    const base64 = Buffer.from(imageData).toString('base64');

    return `data:${contentType};base64,${base64}`;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching image:', errorMessage);
    return '';
  }
}

/**
 * Validate and process logo configuration
 */
export function processLogoConfig(logoConfig: any, baseUrl: string) {
  if (!(logoConfig?.show && logoConfig.src)) {
    return null;
  }

  return {
    src: logoConfig.src.startsWith('http')
      ? logoConfig.src
      : `${baseUrl}${logoConfig.src}`,
    width: logoConfig.width || 100,
    height: logoConfig.height || 100,
    position: logoConfig.position || { top: 50, left: 50 },
  };
}
