import config from '@/config';
import { DEFAULT_BACKGROUND_OPACITY } from '@/lib/constants/defaults';

// Define TypeScript interfaces to match our configuration
export type OGLogoPosition = {
  top: number;
  left: number;
};

export type OGLogoConfig = {
  show?: boolean;
  src?: string;
  width?: number | string;
  height?: number | string;
  position?: OGLogoPosition;
};

export type OGGradientConfig = {
  enabled?: boolean;
  color?: string | null;
  angle?: number;
  startOpacity?: number;
  endOpacity?: number;
};

export type OGFontConfig = {
  family?: string | null;
};

export type OGConfig = {
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
};

export type ProcessedOGConfig = {
  fontFamily: string;
  siteTitle: string;
  siteDescription: string;
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundImage: string | null;
  titleColor: string;
  descriptionColor: string;
  gradientEnabled: boolean;
  gradientColor: string;
  gradientAngle: number;
  gradientStartOpacity: number;
  gradientEndOpacity: number;
};

/**
 * Parse and validate OG configuration with fallbacks
 */
export function parseOGConfig(ogConfig: OGConfig = {}): ProcessedOGConfig {
  const fontFamily = ogConfig.font?.family || config.font.family || 'geist';
  const siteTitle = ogConfig.title || config.title || 'Bordful';
  const siteDescription =
    ogConfig.description || config.description || 'Find your dream job today!';
  const backgroundColor =
    ogConfig.backgroundColor || config.ui.heroBackgroundColor || '#005450';
  const backgroundOpacity =
    ogConfig.backgroundOpacity !== undefined
      ? ogConfig.backgroundOpacity
      : DEFAULT_BACKGROUND_OPACITY;
  const backgroundImage = ogConfig.backgroundImage || null;
  const titleColor =
    ogConfig.titleColor || config.ui.heroTitleColor || '#FFFFFF';
  const descriptionColor =
    ogConfig.descriptionColor || config.ui.heroSubtitleColor || '#FFFFFF';

  // Gradient configuration
  const gradientEnabled = ogConfig.gradient?.enabled !== false;
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

  return {
    fontFamily,
    siteTitle,
    siteDescription,
    backgroundColor,
    backgroundOpacity,
    backgroundImage,
    titleColor,
    descriptionColor,
    gradientEnabled,
    gradientColor,
    gradientAngle,
    gradientStartOpacity,
    gradientEndOpacity,
  };
}

/**
 * Check if OG generation is enabled
 */
export function isOGEnabled(ogConfig: OGConfig = {}): boolean {
  return ogConfig.enabled !== false;
}

/**
 * Create gradient CSS string
 */
export function createLinearGradient(
  color: string,
  angle: number,
  startOpacity: number,
  endOpacity: number
): string {
  const startColor =
    color +
    Math.round(startOpacity * 255)
      .toString(16)
      .padStart(2, '0');
  const endColor =
    color +
    Math.round(endOpacity * 255)
      .toString(16)
      .padStart(2, '0');

  return `linear-gradient(${angle}deg, ${startColor}, ${endColor})`;
}

/**
 * Convert hex color to RGBA
 */
export function hexToRGBA(hex: string, opacity: number): string {
  const cleanHex = hex.replace('#', '');
  const r = Number.parseInt(cleanHex.substring(0, 2), 16);
  const g = Number.parseInt(cleanHex.substring(2, 4), 16);
  const b = Number.parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
