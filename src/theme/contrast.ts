import { THEME_COLOR_KEYS, type ThemeColorKey } from "./tokens";

const HEX_COLOR = /^#([0-9a-f]{6})$/i;
const SRGB_BREAKPOINT = 0.039_28;
const SRGB_OFFSET = 0.055;
const SRGB_SCALE = 1.055;
const SRGB_GAMMA = 2.4;
const LINEAR_SCALE = 12.92;
const CHANNEL_MAX = 255;
const RED_WEIGHT = 0.2126;
const GREEN_WEIGHT = 0.7152;
const BLUE_WEIGHT = 0.0722;
const CONTRAST_OFFSET = 0.05;
const CONTRAST_DECIMALS = 100;

export const THEME_CONTRAST_PAIRS = [
  ["background", "foreground"],
  ["primary", "primaryForeground"],
  ["muted", "mutedForeground"],
  ["accent", "accentForeground"],
] as const;

const PAIRED_COLOR_KEYS = new Map<ThemeColorKey, ThemeColorKey>();
for (const [left, right] of THEME_CONTRAST_PAIRS) {
  PAIRED_COLOR_KEYS.set(left, right);
  PAIRED_COLOR_KEYS.set(right, left);
}

function hexChannels(hex: string): [number, number, number] | null {
  const match = HEX_COLOR.exec(hex);
  const digits = match?.[1];
  if (digits === undefined) {
    return null;
  }

  const red = Number.parseInt(digits.slice(0, 2), 16);
  const green = Number.parseInt(digits.slice(2, 4), 16);
  const blue = Number.parseInt(digits.slice(4, 6), 16);
  return [red, green, blue];
}

function linearChannel(value: number): number {
  const unit = value / CHANNEL_MAX;
  // WCAG 2.x uses 0.03928. The IEC sRGB breakpoint 0.04045 is a different curve.
  if (unit <= SRGB_BREAKPOINT) {
    return unit / LINEAR_SCALE;
  }

  return ((unit + SRGB_OFFSET) / SRGB_SCALE) ** SRGB_GAMMA;
}

export function relativeLuminance(hex: string): number | null {
  const channels = hexChannels(hex);
  if (channels === null) {
    return null;
  }

  const [red, green, blue] = channels;
  return (
    RED_WEIGHT * linearChannel(red) +
    GREEN_WEIGHT * linearChannel(green) +
    BLUE_WEIGHT * linearChannel(blue)
  );
}

export function contrastRatio(a: string, b: string): number | null {
  const left = relativeLuminance(a);
  const right = relativeLuminance(b);
  if (left === null || right === null) {
    return null;
  }

  const lighter = Math.max(left, right);
  const darker = Math.min(left, right);
  const ratio = (lighter + CONTRAST_OFFSET) / (darker + CONTRAST_OFFSET);
  return Math.round(ratio * CONTRAST_DECIMALS) / CONTRAST_DECIMALS;
}

function isThemeColorKey(key: string): key is ThemeColorKey {
  return (THEME_COLOR_KEYS as readonly string[]).includes(key);
}

export function pairedColorKey(key: string): ThemeColorKey | null {
  if (!isThemeColorKey(key)) {
    return null;
  }

  return PAIRED_COLOR_KEYS.get(key) ?? null;
}
