import { FONT_URL_REGEX, WHITESPACE_REGEX } from '@/lib/constants/defaults';

export type ImageResponseFont = {
  name: string;
  data: ArrayBuffer | Uint8Array;
  weight?: number;
  style?: string;
};

export type FontInfo = {
  familyName: string;
  nameToLoad: string;
};

/**
 * Get font family information based on font family string
 */
export function getFontInfo(fontFamily: string): FontInfo {
  switch (fontFamily) {
    case 'inter':
      return {
        familyName: 'Inter',
        nameToLoad: 'Inter',
      };
    case 'ibm-plex-serif':
      return {
        familyName: 'IBM Plex Serif',
        nameToLoad: 'IBM Plex Serif',
      };
    default: // geist or others
      return {
        familyName: '',
        nameToLoad: '',
      };
  }
}

/**
 * Load font data from Google Fonts for a family subset
 */
export async function loadGoogleFontData(
  fontFamily: string,
  text: string
): Promise<ArrayBuffer | null> {
  // Replace spaces for URL compatibility
  const fontNameForUrl = fontFamily.replace(WHITESPACE_REGEX, '+');
  // Fetch CSS for the family, subset by text, WITHOUT specifying weight
  const url = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}&text=${encodeURIComponent(
    text
  )}`;

  try {
    const cssResponse = await fetch(url);
    if (!cssResponse.ok) {
      return null;
    }
    const css = await cssResponse.text();

    // Extract the first compatible (TTF/OTF) font URL
    const resource = css.match(FONT_URL_REGEX);

    if (!resource?.[1]) {
      return null;
    }

    // Fetch the actual font file
    const fontResponse = await fetch(resource[1]);
    if (!fontResponse.ok) {
      return null;
    }

    return await fontResponse.arrayBuffer();
  } catch (error: unknown) {
    console.error('Error loading Google Font:', error);
    return null;
  }
}

/**
 * Prepare fonts array for ImageResponse
 */
export function prepareImageResponseFonts(
  fontFamily: string,
  fontData: ArrayBuffer | null,
  textToRender: string
): ImageResponseFont[] {
  const fonts: ImageResponseFont[] = [];

  const fontInfo = getFontInfo(fontFamily);

  // Load font data if needed
  if (fontInfo.nameToLoad && fontData) {
    fonts.push({
      name: fontInfo.familyName,
      data: fontData,
      weight: 800, // For title
      style: 'normal',
    });
    fonts.push({
      name: fontInfo.familyName,
      data: fontData,
      weight: 400, // For description
      style: 'normal',
    });
  } else {
    // Use system fonts as fallback
    fonts.push({
      name: 'system-ui',
      data: new ArrayBuffer(0), // Empty buffer for system fonts
      weight: 800,
    });
    fonts.push({
      name: 'system-ui',
      data: new ArrayBuffer(0),
      weight: 400,
    });
  }

  return fonts;
}

/**
 * Get font family CSS string for rendering
 */
export function getFontFamilyCSS(
  fontFamily: string,
  fontInfo: FontInfo,
  fonts: ImageResponseFont[]
): string {
  if (fontInfo.familyName && fonts.length > 0) {
    return fontInfo.familyName;
  }

  if (fontFamily === 'ibm-plex-serif') {
    return 'IBM Plex Serif, serif';
  }

  return 'system-ui, -apple-system, sans-serif';
}
