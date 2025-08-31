import config from '@/config';
import {
  isOGEnabled,
  type OGConfig,
  parseOGConfig,
} from '@/lib/utils/og-config';
import {
  createOGImageResponse,
  type LogoConfig,
  prepareBackgroundImage,
  prepareOGAssets,
  processLogo,
} from '@/lib/utils/og-helpers';

// Specify that this route should run on Vercel's edge runtime
export const runtime = 'edge';

/**
 * Generate a dynamic Open Graph image based on the site configuration
 * using dynamically fetched Google Fonts.
 * @returns {Promise<ImageResponse | Response>} The generated image response or an error response
 */
export async function GET() {
  // Get and type-check the OG configuration
  const ogConfig: OGConfig = config.og || {};

  // Check if OG image generation is enabled
  if (!isOGEnabled(ogConfig)) {
    return new Response('OG image generation is disabled in config', {
      status: 404,
    });
  }

  // Parse configuration with fallbacks
  const parsedConfig = parseOGConfig(ogConfig);

  try {
    // Prepare all assets (fonts, etc.)
    const { fontFamilyCSS, imageResponseFonts } =
      await prepareOGAssets(parsedConfig);

    // Prepare background image
    const bgImageDataUri = await prepareBackgroundImage(
      parsedConfig.backgroundImage
    );

    // Process logo
    const logoConfig: LogoConfig = ogConfig.logo || {};
    const processedLogo = await processLogo(logoConfig);

    // Generate and return the image
    return await createOGImageResponse(
      parsedConfig,
      fontFamilyCSS,
      imageResponseFonts,
      bgImageDataUri,
      processedLogo
    );
  } catch (_error: unknown) {
    return new Response('Error generating OG image', { status: 500 });
  }
}
