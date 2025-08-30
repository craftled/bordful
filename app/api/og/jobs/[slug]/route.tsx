import { ImageResponse } from 'next/og';
import config from '@/config';
import { getJobs } from '@/lib/db/airtable';
import { generateJobSlug } from '@/lib/utils/slugify';

// Use the nodejs runtime to ensure full environment variable access
export const runtime = 'nodejs';

// Get job data using the existing getJobs function for consistency
async function getJobBySlugMinimal(slug: string) {
  try {
    // Get all jobs using the existing getJobs function
    const jobs = await getJobs();

    // Find the job with a matching slug
    const job = jobs.find((j) => generateJobSlug(j.title, j.company) === slug);

    if (!job) {
      return null;
    }

    // Check if job is active (though getJobs() should already filter active jobs)
    if (job.status !== 'active') {
      return null;
    }

    // Return only the fields needed for OG image generation
    return {
      title: job.title,
      company: job.company,
      type: job.type,
      workplace_type: job.workplace_type,
    };
  } catch (_error) {
    return null;
  }
}

// Define TypeScript interfaces to match our configuration
type OGLogoPosition = {
  top: number;
  left: number;
};

type OGLogoConfig = {
  show?: boolean;
  src?: string;
  width?: number | string;
  height?: number | string;
  position?: OGLogoPosition;
};

type OGGradientConfig = {
  enabled?: boolean;
  color?: string | null;
  angle?: number;
  startOpacity?: number;
  endOpacity?: number;
};

type OGFontConfig = {
  family?: string | null;
};

type OGJobConfig = {
  enabled?: boolean;
  backgroundColor?: string | null;
  backgroundOpacity?: number;
  backgroundImage?: string;
  gradient?: OGGradientConfig;
  titleColor?: string | null;
  companyColor?: string | null;
  font?: OGFontConfig;
  logo?: OGLogoConfig;
};

// Common style constants
const SHARED_STYLES = {
  DIMENSIONS: {
    WIDTH: 1200,
    HEIGHT: 630,
    PADDING: 60,
    CONTENT_WIDTH: 1080, // WIDTH - (PADDING * 2)
  },
  FONTS: {
    TITLE_SIZE: 60,
    COMPANY_SIZE: 36,
    TITLE_WEIGHT: 800,
    COMPANY_WEIGHT: 600,
    TITLE_LINE_HEIGHT: 1.2,
    COMPANY_LINE_HEIGHT: 1.3,
  },
  Z_INDEX: {
    CONTENT: 10, // Unitless value for zIndex
  },
};

// Helper function to load font data from Google Fonts for a family subset
async function loadGoogleFontData(
  fontFamily: string,
  text: string
): Promise<ArrayBuffer | null> {
  const fontNameForUrl = fontFamily.replace(/\s/g, '+');
  const url = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}&text=${encodeURIComponent(
    text
  )}`;

  try {
    const cssResponse = await fetch(url);
    if (!cssResponse.ok) {
      return null;
    }
    const css = await cssResponse.text();

    const resource = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/
    );

    if (resource?.[1]) {
      const fontDataResponse = await fetch(resource[1]);
      if (fontDataResponse.ok) {
        return await fontDataResponse.arrayBuffer();
      }
      return null;
    }
    return null;
  } catch (_error) {
    return null;
  }
}

// Helper function to convert hex color to RGBA
function hexToRGBA(hex: string, alpha: number): string {
  // Default fallback
  if (!hex || hex === 'null') {
    return `rgba(0, 84, 80, ${alpha})`;
  }

  // Remove the # if present
  hex = hex.replace('#', '');

  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    // For shorthand hex like #ABC
    r = Number.parseInt(hex[0] + hex[0], 16);
    g = Number.parseInt(hex[1] + hex[1], 16);
    b = Number.parseInt(hex[2] + hex[2], 16);
  } else {
    // For full hex like #AABBCC
    r = Number.parseInt(hex.substring(0, 2), 16);
    g = Number.parseInt(hex.substring(2, 4), 16);
    b = Number.parseInt(hex.substring(4, 6), 16);
  }

  // In case of parsing error, use default teal
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(0, 84, 80, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper function to create a CSS linear gradient
function createLinearGradient(
  color: string,
  angle: number,
  startOpacity: number,
  endOpacity: number
): string {
  // Parse color to get RGB values
  const rgbaStart = hexToRGBA(color, startOpacity);
  const rgbaEnd = hexToRGBA(color, endOpacity);

  return `linear-gradient(${angle}deg, ${rgbaEnd} 0%, ${rgbaStart} 100%)`;
}

// Helper function to fetch and convert an image to a data URI
async function fetchImageAsDataURI(
  imageSrc: string,
  baseUrl: string
): Promise<string> {
  try {
    const imageUrl =
      typeof imageSrc === 'string' && imageSrc.startsWith('http')
        ? imageSrc
        : `${baseUrl}${imageSrc}`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('svg')) {
      // Handle SVG
      let svgText = await response.text();
      // Remove width and height attributes from SVG for better styling control
      svgText = svgText.replace(
        /<svg(?=\s)([^>]*?)\s+(width|height)="[^"]*"/g,
        '<svg$1'
      );
      return `data:image/svg+xml;base64,${Buffer.from(svgText).toString(
        'base64'
      )}`;
    }
    // Handle other image types (PNG, JPG, etc.)
    const imageData = await response.arrayBuffer();
    const base64 = Buffer.from(imageData).toString('base64');
    return `data:${contentType};base64,${base64}`;
  } catch (error: unknown) {
    const _errorMessage =
      error instanceof Error ? error.message : String(error);
    return ''; // Return empty string on error
  }
}

/**
 * Generate a dynamic Open Graph image for a specific job post
 */
export async function GET(
  _request: Request,
  context: { params: { slug: string } }
): Promise<ImageResponse | Response> {
  try {
    // Get the job slug and fetch job data
    const params = await context.params;
    const { slug } = params;

    const job = await getJobBySlugMinimal(slug);
    if (!job) {
      return new Response(`Job not found: ${slug}`, { status: 404 });
    }

    // Continue with OG configuration using job data
    const ogJobConfig: OGJobConfig = config.og?.jobs || {};

    // Check if job OG image generation is enabled
    if (ogJobConfig.enabled === false) {
      return new Response('Job OG image generation is disabled in config', {
        status: 404,
      });
    }

    // Get config values with fallbacks
    const fontFamily =
      ogJobConfig.font?.family || config.font.family || 'geist';
    const backgroundColor =
      ogJobConfig.backgroundColor || config.ui.heroBackgroundColor || '#005450';
    const backgroundOpacity =
      ogJobConfig.backgroundOpacity !== undefined
        ? ogJobConfig.backgroundOpacity
        : 0.9;
    const backgroundImage = ogJobConfig.backgroundImage || null;
    const titleColor =
      ogJobConfig.titleColor || config.ui.heroTitleColor || '#FFFFFF';
    const companyColor =
      ogJobConfig.companyColor || config.ui.heroTitleColor || '#FFFFFF';

    // Gradient configuration
    const gradientEnabled = ogJobConfig.gradient?.enabled !== false;
    const gradientColor = ogJobConfig.gradient?.color || backgroundColor;
    const gradientAngle =
      ogJobConfig.gradient?.angle !== undefined
        ? ogJobConfig.gradient.angle
        : 0;
    const gradientStartOpacity =
      ogJobConfig.gradient?.startOpacity !== undefined
        ? ogJobConfig.gradient.startOpacity
        : 0;
    const gradientEndOpacity =
      ogJobConfig.gradient?.endOpacity !== undefined
        ? ogJobConfig.gradient.endOpacity
        : 1;

    // Create gradient if enabled
    const gradientCSS = gradientEnabled
      ? createLinearGradient(
          gradientColor,
          gradientAngle,
          gradientStartOpacity,
          gradientEndOpacity
        )
      : '';

    // Convert background color to RGBA for the overlay
    const backgroundColorRGBA = hexToRGBA(backgroundColor, backgroundOpacity);

    // Format job details for display
    const jobTitle = job.title;
    const companyName = job.company;

    // Combine text for font loading
    const textToRender = `${jobTitle} ${companyName}`;

    // --- Font Loading & Processing ---
    let fontFamilyName = ''; // Name to use in ImageResponse fonts array
    let fontNameToLoad = ''; // Name for Google Fonts API

    switch (fontFamily) {
      case 'inter':
        fontFamilyName = 'Inter';
        fontNameToLoad = 'Inter';
        break;
      case 'ibm-plex-serif':
        fontFamilyName = 'IBM Plex Serif';
        fontNameToLoad = 'IBM Plex Serif';
        break;
      default: // geist or others
        break;
    }

    let fontData: ArrayBuffer | null = null;

    // Load font data ONCE per family if needed
    if (fontNameToLoad) {
      fontData = await loadGoogleFontData(fontNameToLoad, textToRender);
    }

    // Prepare fonts array for ImageResponse
    const imageResponseFonts = [];
    // If font data was loaded successfully, add entries for both weights
    // using the SAME font data buffer.
    if (fontFamilyName && fontData) {
      imageResponseFonts.push({
        name: fontFamilyName,
        data: fontData, // Use the single loaded data buffer
        weight: 400 as const, // Use 'as const' for specific literal type
        style: 'normal' as const, // Use 'as const' for specific literal type
      });
      imageResponseFonts.push({
        name: fontFamilyName,
        data: fontData, // Use the single loaded data buffer
        weight: 600 as const, // Use 'as const' for specific literal type
        style: 'normal' as const, // Use 'as const' for specific literal type
      });
      imageResponseFonts.push({
        name: fontFamilyName,
        data: fontData, // Use the single loaded data buffer
        weight: 800 as const, // Use 'as const' for specific literal type
        style: 'normal' as const, // Use 'as const' for specific literal type
      });
    }

    // Use the font family name for CSS if loaded, otherwise fallback
    const fontFamilyCSS =
      fontFamilyName && imageResponseFonts.length > 0
        ? fontFamilyName
        : fontFamily === 'ibm-plex-serif'
          ? 'serif'
          : 'sans-serif';

    // --- Background Image Handling ---
    let bgImageDataUri = '';
    if (backgroundImage) {
      bgImageDataUri = await fetchImageAsDataURI(backgroundImage, config.url);
    }

    // --- Logo Handling ---
    let logoDataUri = ''; // Initialize as empty

    // Get logo configuration with proper type checking
    const logoConfig = ogJobConfig.logo || {};
    const logoEnabled = logoConfig.show !== false; // Default to true if not specified
    const logoSrc = logoConfig.src || ''; // Get source directly from config

    // Get logo dimensions
    const logoHeight = logoConfig.height || 56;
    // NOTE: Always use a fixed width (number) value - "auto" doesn't work reliably with Satori
    const logoWidth = logoConfig.width || 185; // Default fixed width if not specified

    // Only try to load the logo if it's enabled and has a source
    if (logoEnabled && logoSrc) {
      logoDataUri = await fetchImageAsDataURI(logoSrc, config.url);
    }

    return new ImageResponse(
      <div
        style={{
          width: `${SHARED_STYLES.DIMENSIONS.WIDTH}px`,
          height: `${SHARED_STYLES.DIMENSIONS.HEIGHT}px`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Background Image Layer */}
        {bgImageDataUri && (
          <img
            alt="Background"
            src={bgImageDataUri}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Background Color Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: backgroundColorRGBA,
          }}
        />

        {/* Gradient Overlay */}
        {gradientEnabled && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: gradientCSS,
            }}
          />
        )}

        {/* Content Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            color: 'white',
            fontFamily: fontFamilyCSS,
            textAlign: 'left',
            padding: `${SHARED_STYLES.DIMENSIONS.PADDING}px`,
            zIndex: SHARED_STYLES.Z_INDEX.CONTENT, // Use unitless value for zIndex
          }}
        >
          {/* Logo Image */}
          {logoDataUri && (
            <img
              alt={`${config.title} Logo`}
              src={logoDataUri}
              style={{
                height:
                  typeof logoHeight === 'number'
                    ? `${logoHeight}px`
                    : logoHeight,
                width:
                  typeof logoWidth === 'number' ? `${logoWidth}px` : logoWidth,
                objectFit: 'contain',
              }}
            />
          )}

          {/* Text container for job details - positioned at bottom */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              maxWidth: `${SHARED_STYLES.DIMENSIONS.CONTENT_WIDTH}px`,
            }}
          >
            <h2
              style={{
                fontSize: `${SHARED_STYLES.FONTS.COMPANY_SIZE}px`,
                fontWeight: SHARED_STYLES.FONTS.COMPANY_WEIGHT,
                color: companyColor,
                margin: '0 0 16px 0',
                lineHeight: SHARED_STYLES.FONTS.COMPANY_LINE_HEIGHT,
                textAlign: 'left',
              }}
            >
              {companyName}
            </h2>
            <h1
              style={{
                fontSize: `${SHARED_STYLES.FONTS.TITLE_SIZE}px`,
                fontWeight: SHARED_STYLES.FONTS.TITLE_WEIGHT,
                color: titleColor,
                margin: '0',
                lineHeight: SHARED_STYLES.FONTS.TITLE_LINE_HEIGHT,
                textAlign: 'left',
              }}
            >
              {jobTitle}
            </h1>
          </div>
        </div>
      </div>,
      {
        width: SHARED_STYLES.DIMENSIONS.WIDTH,
        height: SHARED_STYLES.DIMENSIONS.HEIGHT,
        fonts: imageResponseFonts.length > 0 ? imageResponseFonts : undefined,
      }
    );
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    return new Response(`Failed to generate the job image: ${errorMessage}`, {
      status: 500,
    });
  }
}
