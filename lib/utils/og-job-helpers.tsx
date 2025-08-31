import { ImageResponse } from 'next/og';
import config from '@/config';
import {
  getFontFamilyCSS,
  getFontInfo,
  loadGoogleFontData,
  prepareImageResponseFonts,
} from '@/lib/utils/font-utils';
import { fetchImageAsDataURI } from '@/lib/utils/image-utils';
import type { MinimalJob } from '@/lib/utils/job-validation';
import {
  createLinearGradient,
  hexToRGBA,
  type ProcessedOGConfig,
} from '@/lib/utils/og-config';

export interface JobProcessedOGConfig extends ProcessedOGConfig {
  jobTitle: string;
  companyName: string;
  workplaceType: string;
}

/**
 * Create job-specific OG configuration
 */
export function createJobOGConfig(job: MinimalJob): JobProcessedOGConfig {
  const ogJobConfig = config.og?.jobs || {};

  return {
    fontFamily: ogJobConfig.font?.family || config.font.family || 'geist',
    siteTitle: `${job.title} at ${job.company}`,
    siteDescription: `Apply for ${job.type} position - ${job.workplace_type}`,
    backgroundColor:
      ogJobConfig.backgroundColor || config.ui.heroBackgroundColor || '#005450',
    backgroundOpacity:
      ogJobConfig.backgroundOpacity !== undefined
        ? ogJobConfig.backgroundOpacity
        : 0.8,
    backgroundImage: ogJobConfig.backgroundImage || null,
    titleColor: ogJobConfig.titleColor || config.ui.heroTitleColor || '#FFFFFF',
    descriptionColor:
      ogJobConfig.descriptionColor || config.ui.heroSubtitleColor || '#FFFFFF',
    gradientEnabled: ogJobConfig.gradient?.enabled !== false,
    gradientColor:
      ogJobConfig.gradient?.color ||
      ogJobConfig.backgroundColor || config.ui.heroBackgroundColor ||
      '#005450',
    gradientAngle:
      ogJobConfig.gradient?.angle !== undefined
        ? ogJobConfig.gradient.angle
        : 0,
    gradientStartOpacity:
      ogJobConfig.gradient?.startOpacity !== undefined
        ? ogJobConfig.gradient.startOpacity
        : 0,
    gradientEndOpacity:
      ogJobConfig.gradient?.endOpacity !== undefined
        ? ogJobConfig.gradient.endOpacity
        : 1,
    jobTitle: job.title,
    companyName: job.company,
    workplaceType: job.workplace_type,
  };
}

/**
 * Create the complete ImageResponse for job OG image
 */
export async function createJobOGImageResponse(
  config: JobProcessedOGConfig,
  fontFamilyCSS: string,
  imageResponseFonts: any[],
  bgImageDataUri: string,
  logoDataUri: string
): Promise<ImageResponse> {
  const gradientCSS = config.gradientEnabled
    ? createLinearGradient(
        config.gradientColor,
        config.gradientAngle,
        config.gradientStartOpacity,
        config.gradientEndOpacity
      )
    : '';

  const backgroundColorRGBA = hexToRGBA(
    config.backgroundColor,
    config.backgroundOpacity
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
      {config.gradientEnabled && (
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
          zIndex: SHARED_STYLES.Z_INDEX.CONTENT,
        }}
      >
        {/* Logo Image */}
        {Boolean(logoDataUri) && (
          <img
            alt={`${config.siteTitle} Logo`}
            height={100}
            src={logoDataUri}
            style={{
              height: '100px',
              width: '100px',
              objectFit: 'contain',
            }}
            width={100}
          />
        )}

        {/* Text container for job details */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <h1
            style={{
              fontSize: `${SHARED_STYLES.FONTS.TITLE_SIZE}px`,
              fontWeight: SHARED_STYLES.FONTS.TITLE_WEIGHT,
              color: config.titleColor,
              margin: '0 0 10px 0',
              lineHeight: SHARED_STYLES.FONTS.TITLE_LINE_HEIGHT,
              textAlign: 'left',
              maxWidth: `${SHARED_STYLES.DIMENSIONS.CONTENT_WIDTH}px`,
            }}
          >
            {config.jobTitle}
          </h1>
          <p
            style={{
              fontSize: `${SHARED_STYLES.FONTS.DESCRIPTION_SIZE}px`,
              fontWeight: SHARED_STYLES.FONTS.DESCRIPTION_WEIGHT,
              color: config.titleColor,
              margin: '0 0 20px 0',
              lineHeight: SHARED_STYLES.FONTS.DESCRIPTION_LINE_HEIGHT,
              textAlign: 'left',
              maxWidth: `${SHARED_STYLES.DIMENSIONS.CONTENT_WIDTH}px`,
            }}
          >
            at {config.companyName}
          </p>
          <p
            style={{
              fontSize: `${SHARED_STYLES.FONTS.DESCRIPTION_SIZE}px`,
              fontWeight: SHARED_STYLES.FONTS.DESCRIPTION_WEIGHT,
              color: config.descriptionColor,
              maxWidth: `${SHARED_STYLES.DIMENSIONS.CONTENT_WIDTH}px`,
              margin: 0,
              lineHeight: SHARED_STYLES.FONTS.DESCRIPTION_LINE_HEIGHT,
              textAlign: 'left',
            }}
          >
            {config.siteDescription}
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
