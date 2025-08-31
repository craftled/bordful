import config from '@/config';
import {
  getFontFamilyCSS,
  getFontInfo,
  loadGoogleFontData,
  prepareImageResponseFonts,
} from '@/lib/utils/font-utils';
import { fetchImageAsDataURI } from '@/lib/utils/image-utils';
import { validateJobAndParams } from '@/lib/utils/job-validation';
import {
  createJobOGConfig,
  createJobOGImageResponse,
} from '@/lib/utils/og-job-helpers';

// Use the nodejs runtime to ensure full environment variable access
export const runtime = 'nodejs';

/**
 * Generate a dynamic Open Graph image for a specific job post
 * using dynamically fetched Google Fonts.
 */
export async function GET(
  _request: Request,
  context: { params: { slug: string } }
) {
  try {
    // Validate parameters and fetch job
    const validationResult = await validateJobAndParams(context);
    if (validationResult instanceof Response) {
      return validationResult;
    }
    const { job } = validationResult;

    // Create job-specific OG configuration
    const jobConfig = createJobOGConfig(job);

    // Prepare font assets
    const fontInfo = getFontInfo(jobConfig.fontFamily);
    let fontData: ArrayBuffer | null = null;

    if (fontInfo.nameToLoad) {
      fontData = await loadGoogleFontData(
        fontInfo.nameToLoad,
        `${job.title} ${job.company}`
      );
    }

    const imageResponseFonts = prepareImageResponseFonts(
      jobConfig.fontFamily,
      fontData,
      `${job.title} ${job.company}`
    );

    const fontFamilyCSS = getFontFamilyCSS(
      jobConfig.fontFamily,
      fontInfo,
      imageResponseFonts
    );

    // Prepare background image
    const bgImageDataUri = jobConfig.backgroundImage
      ? await fetchImageAsDataURI(jobConfig.backgroundImage, config.url)
      : '';

    // Prepare logo
    const ogJobConfig = config.og?.jobs || {};
    const logoConfig = ogJobConfig.logo || {};
    const logoDataUri =
      logoConfig.show !== false && logoConfig.src
        ? await fetchImageAsDataURI(logoConfig.src, config.url)
        : '';

    // Generate and return the image
    return await createJobOGImageResponse(
      jobConfig,
      fontFamilyCSS,
      imageResponseFonts,
      bgImageDataUri,
      logoDataUri
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(`Failed to generate job image: ${errorMessage}`, {
      status: 500,
    });
  }
}
