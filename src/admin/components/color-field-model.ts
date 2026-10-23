import { contrastRatio, pairedColorKey } from "@/theme/contrast";
import {
  DEFAULT_THEME_TOKENS,
  THEME_COLOR_KEYS,
  type ThemeColorKey,
} from "@/theme/tokens";

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const AA_TEXT_RATIO = 4.5;

export interface ColorFieldModel {
  lowContrast: boolean;
  ratio: number | null;
  swatch: string;
}

function isThemeColorKey(key: string): key is ThemeColorKey {
  return (THEME_COLOR_KEYS as readonly string[]).includes(key);
}

function validHex(value: string): string | null {
  return HEX_COLOR.test(value) ? value.toLowerCase() : null;
}

export function colorFieldKey(path: string): string {
  const segments = path.split(".");
  return segments.at(-1) ?? path;
}

export function colorFieldLabel(key: string, label: unknown): string {
  if (typeof label === "string" && label.trim().length > 0) {
    return label;
  }

  const spaced = key
    .replaceAll(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
  if (spaced.length === 0) {
    return "Color";
  }

  return `${spaced.charAt(0).toUpperCase()}${spaced.slice(1)}`;
}

export function pairedFieldPath(path: string, paired: ThemeColorKey): string {
  const segments = path.split(".");
  segments[segments.length - 1] = paired;
  return segments.join(".");
}

export function colorFieldModel(
  value: string,
  pairedValue: string,
  key: string
): ColorFieldModel {
  const colorKey = isThemeColorKey(key) ? key : null;
  const fallback = colorKey ? DEFAULT_THEME_TOKENS.colors[colorKey] : "#000000";
  const swatch = validHex(value) ?? fallback;
  const pair = colorKey === null ? null : pairedColorKey(colorKey);
  if (pair === null) {
    return { lowContrast: false, ratio: null, swatch };
  }

  const other = validHex(pairedValue) ?? DEFAULT_THEME_TOKENS.colors[pair];
  const ratio = contrastRatio(swatch, other);
  return {
    lowContrast: ratio !== null && ratio < AA_TEXT_RATIO,
    ratio,
    swatch,
  };
}
