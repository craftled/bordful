import { ImageResponse } from "next/og";
import config from "@/config";

// Specify that this route should run on Vercel's edge runtime
export const runtime = "edge";

// Define TypeScript interfaces to match our configuration
interface OGLogoPosition {
  top: number;
  left: number;
}

interface OGLogoConfig {
  show?: boolean;
  src?: string;
  width?: number | string;
  height?: number | string;
  position?: OGLogoPosition;
}

interface OGGradientConfig {
  enabled?: boolean;
  color?: string | null;
  angle?: number;
  startOpacity?: number;
  endOpacity?: number;
}

interface OGFontConfig {
  family?: string | null;
}

interface OGConfig {
  enabled?: boolean;
  title?: string | null;
  description?: string | null;
  backgroundColor?: string | null;
  backgroundOpacity?: number;
  backgroundImage?: string;
  gradient?: OGGradientConfig;
  titleColor?: string | null;
  descriptionColor?: string | null;
  font?: OGFontConfig;
  logo?: OGLogoConfig;
}

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

// Helper function to load font data from Google Fonts for a family subset
async function loadGoogleFontData(
  fontFamily: string,
  text: string
): Promise<ArrayBuffer | null> {
  // Replace spaces for URL compatibility
  const fontNameForUrl = fontFamily.replace(/\s/g, "+");
  // Fetch CSS for the family, subset by text, WITHOUT specifying weight
  const url = `https://fonts.googleapis.com/css2?family=${fontNameForUrl}&text=${encodeURIComponent(
    text
  )}`;

  try {
    const cssResponse = await fetch(url);
    if (!cssResponse.ok) {
      console.error(
        `Failed to fetch Google Font CSS (${fontFamily}): ${cssResponse.status} ${cssResponse.statusText}`
      );
      return null;
    }
    const css = await cssResponse.text();

    // Extract the first compatible (TTF/OTF) font URL
    const resource = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/
    );

    if (resource && resource[1]) {
      const fontDataResponse = await fetch(resource[1]);
      if (fontDataResponse.ok) {
        return await fontDataResponse.arrayBuffer();
      } else {
        console.error(
          `Failed to fetch font data (${fontFamily}): ${fontDataResponse.status} ${fontDataResponse.statusText}`
        );
        return null;
      }
    } else {
      console.error(
        `Could not extract compatible (TTF/OTF) font URL from Google CSS (${fontFamily})`
      );
      return null;
    }
  } catch (error) {
    console.error(`Error loading Google Font (${fontFamily}):`, error);
    return null;
  }
}

// Helper function to convert hex color to RGBA
function hexToRGBA(hex: string, alpha: number): string {
  // Default fallback
  if (!hex || hex === "null") return `rgba(0, 84, 80, ${alpha})`;

  // Remove the # if present
  hex = hex.replace("#", "");

  // Parse the hex values
  let r, g, b;
  if (hex.length === 3) {
    // For shorthand hex like #ABC
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else {
    // For full hex like #AABBCC
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }

  // In case of parsing error, use default teal
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
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
      typeof imageSrc === "string" && imageSrc.startsWith("http")
        ? imageSrc
        : `${baseUrl}${imageSrc}`;

    console.log(`Fetching image from: ${imageUrl}`);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("svg")) {
      // Handle SVG
      let svgText = await response.text();
      // Remove width and height attributes from SVG for better styling control
      svgText = svgText.replace(
        /<svg(?=\s)([^>]*?)\s+(width|height)="[^"]*"/g,
        "<svg$1"
      );
      return `data:image/svg+xml;base64,${Buffer.from(svgText).toString("base64")}`;
    } else {
      // Handle other image types (PNG, JPG, etc.)
      const imageData = await response.arrayBuffer();
      const base64 = Buffer.from(imageData).toString("base64");
      return `data:${contentType};base64,${base64}`;
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching or processing image: ${errorMessage}`);
    return ""; // Return empty string on error
  }
}

/**
 * Generate a dynamic Open Graph image based on the site configuration
 * using dynamically fetched Google Fonts.
 * @returns {Promise<ImageResponse | Response>} The generated image response or an error response
 */
export async function GET(): Promise<ImageResponse | Response> {
  // Get and type-check the OG configuration
  const ogConfig: OGConfig = config.og || {};

  // Check if OG image generation is enabled
  if (ogConfig.enabled === false) {
    return new Response("OG image generation is disabled in config", {
      status: 404,
    });
  }

  // Get config values with fallbacks
  const fontFamily = ogConfig.font?.family || config.font.family || "geist";
  const siteTitle = ogConfig.title || config.title || "Bordful";
  const siteDescription =
    ogConfig.description || config.description || "Find your dream job today!";
  const backgroundColor =
    ogConfig.backgroundColor || config.ui.heroBackgroundColor || "#005450";
  const backgroundOpacity =
    ogConfig.backgroundOpacity !== undefined ? ogConfig.backgroundOpacity : 0.9;
  const backgroundImage = ogConfig.backgroundImage || null;
  const titleColor =
    ogConfig.titleColor || config.ui.heroTitleColor || "#FFFFFF";
  const descriptionColor =
    ogConfig.descriptionColor || config.ui.heroSubtitleColor || "#FFFFFF";

  // Gradient configuration
  const gradientEnabled = ogConfig.gradient?.enabled !== false; // Default to true if not specified
  const gradientColor = ogConfig.gradient?.color || backgroundColor;
  const gradientAngle =
    ogConfig.gradient?.angle !== undefined ? ogConfig.gradient.angle : 0;
  const gradientStartOpacity =
    ogConfig.gradient?.startOpacity !== undefined
      ? ogConfig.gradient.startOpacity
      : 0;
  const gradientEndOpacity =
    ogConfig.gradient?.endOpacity !== undefined
      ? ogConfig.gradient.endOpacity
      : 1;

  // Create gradient if enabled
  const gradientCSS = gradientEnabled
    ? createLinearGradient(
        gradientColor,
        gradientAngle,
        gradientStartOpacity,
        gradientEndOpacity
      )
    : "";

  // Convert background color to RGBA for the overlay
  const backgroundColorRGBA = hexToRGBA(backgroundColor, backgroundOpacity);

  const textToRender = `${siteTitle} ${siteDescription}`; // Combine text for font loading

  // --- Font Loading & Processing ---
  let fontFamilyName = ""; // Name to use in ImageResponse fonts array
  let fontNameToLoad = ""; // Name for Google Fonts API

  switch (fontFamily) {
    case "inter":
      fontFamilyName = "Inter";
      fontNameToLoad = "Inter";
      break;
    case "ibm-plex-serif":
      fontFamilyName = "IBM Plex Serif";
      fontNameToLoad = "IBM Plex Serif";
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
      style: "normal" as const, // Use 'as const' for specific literal type
    });
    imageResponseFonts.push({
      name: fontFamilyName,
      data: fontData, // Use the single loaded data buffer
      weight: 800 as const, // Use 'as const' for specific literal type
      style: "normal" as const, // Use 'as const' for specific literal type
    });
  }

  // Use the font family name for CSS if loaded, otherwise fallback
  const fontFamilyCSS =
    fontFamilyName && imageResponseFonts.length > 0
      ? fontFamilyName
      : fontFamily === "ibm-plex-serif"
      ? "serif"
      : "sans-serif";

  // --- Background Image Handling ---
  let bgImageDataUri = "";
  if (backgroundImage) {
    bgImageDataUri = await fetchImageAsDataURI(backgroundImage, config.url);
  }

  // --- Logo Handling ---
  let logoDataUri = ""; // Initialize as empty

  // Get logo configuration with proper type checking
  const logoConfig = ogConfig.logo || {};
  const logoEnabled = logoConfig.show !== false; // Default to true if not specified
  const logoSrc = logoConfig.src || ""; // Get source directly from config

  // Get logo dimensions
  const logoHeight = logoConfig.height || 56;
  // NOTE: Always use a fixed width (number) value - "auto" doesn't work reliably with Satori
  const logoWidth = logoConfig.width || 185; // Default fixed width if not specified

  // Only try to load the logo if it's enabled and has a source
  if (logoEnabled && logoSrc) {
    logoDataUri = await fetchImageAsDataURI(logoSrc, config.url);
  }

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: `${SHARED_STYLES.DIMENSIONS.WIDTH}px`,
            height: `${SHARED_STYLES.DIMENSIONS.HEIGHT}px`,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Background Image Layer */}
          {bgImageDataUri && (
            <img
              src={bgImageDataUri}
              alt="Background"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          )}

          {/* Background Color Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: backgroundColorRGBA,
            }}
          />

          {/* Gradient Overlay */}
          {gradientEnabled && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: gradientCSS,
              }}
            />
          )}

          {/* Content Container */}
          <div
            style={{
              position: "relative", // Position on top of the background
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-start",
              color: "white",
              fontFamily: fontFamilyCSS,
              textAlign: "left",
              padding: `${SHARED_STYLES.DIMENSIONS.PADDING}px`,
              zIndex: SHARED_STYLES.Z_INDEX.CONTENT, // Ensure content is on top - unitless value
            }}
          >
            {/* Logo Image */}
            {logoDataUri && (
              <img
                src={logoDataUri}
                alt={`${config.title} Logo`}
                style={{
                  height:
                    typeof logoHeight === "number"
                      ? `${logoHeight}px`
                      : logoHeight,
                  width:
                    typeof logoWidth === "number"
                      ? `${logoWidth}px`
                      : logoWidth,
                  objectFit: "contain",
                }}
              />
            )}

            {/* Text container for title and description - positioned at bottom */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <h1
                style={{
                  fontSize: `${SHARED_STYLES.FONTS.TITLE_SIZE}px`,
                  fontWeight: SHARED_STYLES.FONTS.TITLE_WEIGHT,
                  color: titleColor,
                  margin: "0 0 20px 0",
                  lineHeight: SHARED_STYLES.FONTS.TITLE_LINE_HEIGHT,
                  textAlign: "left",
                  maxWidth: `${SHARED_STYLES.DIMENSIONS.CONTENT_WIDTH}px`,
                }}
              >
                {siteTitle}
              </h1>
              <p
                style={{
                  fontSize: `${SHARED_STYLES.FONTS.DESCRIPTION_SIZE}px`,
                  fontWeight: SHARED_STYLES.FONTS.DESCRIPTION_WEIGHT,
                  color: descriptionColor,
                  maxWidth: `${SHARED_STYLES.DIMENSIONS.CONTENT_WIDTH}px`,
                  margin: 0,
                  lineHeight: SHARED_STYLES.FONTS.DESCRIPTION_LINE_HEIGHT,
                  textAlign: "left",
                }}
              >
                {siteDescription}
              </p>
            </div>
          </div>
        </div>
      ),
      {
        width: SHARED_STYLES.DIMENSIONS.WIDTH,
        height: SHARED_STYLES.DIMENSIONS.HEIGHT,
        fonts: imageResponseFonts.length > 0 ? imageResponseFonts : undefined,
      }
    );
  } catch (e: unknown) {
    // Use unknown instead of any
    const errorMessage = e instanceof Error ? e.message : String(e); // Type check before accessing message
    console.error(
      `Error generating ImageResponse (${fontFamilyName}): ${errorMessage}`
    );
    return new Response(`Failed to generate the image: ${errorMessage}`, {
      status: 500,
    });
  }
}
