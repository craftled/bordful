import { ImageResponse } from 'next/og';
import config from '@/config';
import {
  DEFAULT_LOGO_HEIGHT,
  DEFAULT_LOGO_WIDTH,
} from '@/lib/constants/defaults';
import {
  getFontFamilyCSS,
  getFontInfo,
  loadGoogleFontData,
  prepareImageResponseFonts,
} from '@/lib/utils/font-utils';
import { fetchImageAsDataURI } from '@/lib/utils/image-utils';
import {
  createLinearGradient,
  hexToRGBA,
  type ProcessedOGConfig,
} from '@/lib/utils/og-config';

export interface LogoConfig {
  show?: boolean;
  src?: string;
  width?: number | string;
  height?: number | string;
}

export interface ProcessedLogoConfig {
  dataUri: string;
  height: number;
  width: number;
  enabled: boolean;
}

/**
 * Process logo configuration and fetch image data
 */
export async function processLogo(
  logoConfig: LogoConfig
): Promise<ProcessedLogoConfig> {
  const enabled = logoConfig.show !== false;
  const src = logoConfig.src || '';
  const height =
    typeof logoConfig.height === 'number'
      ? logoConfig.height
      : DEFAULT_LOGO_HEIGHT;
  const width =
    typeof logoConfig.width === 'number'
      ? logoConfig.width
      : DEFAULT_LOGO_WIDTH;

  let dataUri = '';
  if (enabled && src) {
    dataUri = await fetchImageAsDataURI(src, config.url);
  }

  return { dataUri, height, width, enabled };
}

/**
 * Prepare all assets needed for OG image generation
 */
export async function prepareOGAssets(parsedConfig: ProcessedOGConfig) {
  const fontInfo = getFontInfo(parsedConfig.fontFamily);
  let fontData: ArrayBuffer | null = null;

  // Load font data if needed
  if (fontInfo.nameToLoad) {
    fontData = await loadGoogleFontData(
      fontInfo.nameToLoad,
      `${parsedConfig.siteTitle} ${parsedConfig.siteDescription}`
    );
  }

  // Prepare fonts array for ImageResponse
  const imageResponseFonts = prepareImageResponseFonts(
    parsedConfig.fontFamily,
    fontData,
    `${parsedConfig.siteTitle} ${parsedConfig.siteDescription}`
  );

  // Get font family CSS
  const fontFamilyCSS = getFontFamilyCSS(
    parsedConfig.fontFamily,
    fontInfo,
    imageResponseFonts
  );

  return { fontFamilyCSS, imageResponseFonts };
}

/**
 * Prepare background image for OG generation
 */
export async function prepareBackgroundImage(
  backgroundImage?: string | null
): Promise<string> {
  if (!backgroundImage) return '';

  return await fetchImageAsDataURI(backgroundImage, config.url);
}

/**
 * Create the complete ImageResponse for OG image
 */
export async function createOGImageResponse(
  parsedConfig: ProcessedOGConfig,
  fontFamilyCSS: string,
  imageResponseFonts: any[],
  bgImageDataUri: string,
  logoConfig: ProcessedLogoConfig
): Promise<ImageResponse> {
  const gradientCSS = parsedConfig.gradientEnabled
    ? createLinearGradient(
        parsedConfig.gradientColor,
        parsedConfig.gradientAngle,
        parsedConfig.gradientStartOpacity,
        parsedConfig.gradientEndOpacity
      )
    : '';

  const backgroundColorRGBA = hexToRGBA(
    parsedConfig.backgroundColor,
    parsedConfig.backgroundOpacity
  );

  const SHARED_STYLES = {
    DIMENSIONS: {
      WIDTH: 1200,
      HEIGHT: 630,
      PADDING: 60,
      CONTENT_WIDTH: 1080,
    },
    FONTS: {
      TITLE_SIZE: 60,
      DESCRIPTION_SIZE: 30,
      TITLE_WEIGHT: 800,
      DESCRIPTION_WEIGHT: 400,
      TITLE_LINE_HEIGHT: 1.2,
      DESCRIPTION_LINE_HEIGHT: 1.5,
    },
    Z_INDEX: {
      CONTENT: 10,
    },
  };

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
      {Boolean(bgImageDataUri) && (
        <img
          alt="Background"
          height={SHARED_STYLES.DIMENSIONS.HEIGHT}
          src={bgImageDataUri}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          width={SHARED_STYLES.DIMENSIONS.WIDTH}
        />
      )
}

{
  /* Background Color Overlay */
}
<div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: backgroundColorRGBA,
        }
}
      />

{
  /* Gradient Overlay */
}
{
  parsedConfig.gradientEnabled && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: gradientCSS,
          }
}
/>;
)}

{
  /* Content Container */
}
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
          zIndex: SHARED_STYLES.Z_INDEX.CONTENT,
        }
}
      >
{
  /* Logo Image */
}
{Boolean(logoConfig.dataUri) && (
          <img
            alt={`${config.title} Logo`}
            height={logoConfig.height}
            src={logoConfig.dataUri}
            style={{
              height: `$logoConfig.heightpx`,
              width: `$logoConfig.widthpx`,
              objectFit: 'contain',
            }}
            width={logoConfig.width}
          />
        )}

        {/* Text container for title and description */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <h1
            style={{
              fontSize: `$SHARED_STYLES.FONTS.TITLE_SIZEpx`,
              fontWeight: SHARED_STYLES.FONTS.TITLE_WEIGHT,
              color: parsedConfig.titleColor,
              margin: '0 0 20px 0',
              lineHeight: SHARED_STYLES.FONTS.TITLE_LINE_HEIGHT,
              textAlign: 'left',
              maxWidth: `$SHARED_STYLES.DIMENSIONS.CONTENT_WIDTHpx`,
            }}
          >
            {parsedConfig.siteTitle}
          </h1>
          <p
            style={{
              fontSize: `$SHARED_STYLES.FONTS.DESCRIPTION_SIZEpx`,
              fontWeight: SHARED_STYLES.FONTS.DESCRIPTION_WEIGHT,
              color: parsedConfig.descriptionColor,
              maxWidth: `$SHARED_STYLES.DIMENSIONS.CONTENT_WIDTHpx`,
              margin: 0,
              lineHeight: SHARED_STYLES.FONTS.DESCRIPTION_LINE_HEIGHT,
              textAlign: 'left',
            }}
          >
            {parsedConfig.siteDescription}
          </p>
        </div>
      </div>
    </div>,
    {
      width: SHARED_STYLES.DIMENSIONS.WIDTH,
      height: SHARED_STYLES.DIMENSIONS.HEIGHT,
      fonts: imageResponseFonts.length > 0 ? imageResponseFonts : undefined,
    }
  );
}
