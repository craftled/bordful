// Magic number constants and default values
// These constants are used throughout the application to avoid magic numbers
// and provide centralized configuration

// Color and hex parsing constants
export const HEX_COLOR_SHORTHAND_LENGTH = 3;
export const HEXADECIMAL_BASE = 16;
export const HEX_COLOR_COMPONENT_LENGTH = 2;

// UI defaults
export const DEFAULT_BACKGROUND_OPACITY = 0.9;
export const DEFAULT_LOGO_HEIGHT = 56;
export const DEFAULT_LOGO_WIDTH = 185;

// Content defaults
export const DEFAULT_DESCRIPTION_LENGTH = 500;

// Time constants
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;

// Derived time constants
export const RATE_LIMIT_WINDOW_MS =
  MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// Regex patterns for performance optimization
export const FONT_URL_REGEX =
  /src: url\((.+?)\) format\('(opentype|truetype)'\)/;
export const LEADING_DASHES_REGEX = /^-+/;
export const TRAILING_DASHES_REGEX = /-+$/;
