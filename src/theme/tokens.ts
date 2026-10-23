export const FONT_IDS = ["system", "sans", "serif", "mono"] as const;
export type FontId = (typeof FONT_IDS)[number];

export const FONT_STACKS: Record<FontId, string> = {
  mono: "var(--font-geist-mono), ui-monospace, Menlo, monospace",
  sans: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  serif: "var(--font-ibm-plex-serif), Georgia, serif",
  system: "system-ui, sans-serif",
};

export const THEME_COLOR_KEYS = [
  "background",
  "foreground",
  "primary",
  "primaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "border",
  "ring",
] as const;
export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

export interface ThemeTokens {
  colors: Record<ThemeColorKey, string>;
  fontBody: FontId;
  fontHeading: FontId;
  radius: number;
}

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  colors: {
    accent: "#f4f4f5",
    accentForeground: "#18181b",
    background: "#ffffff",
    border: "#e4e4e7",
    foreground: "#18181b",
    muted: "#f9fafb",
    mutedForeground: "#52525b",
    primary: "#164e63",
    primaryForeground: "#ffffff",
    ring: "#164e63",
  },
  fontBody: "sans",
  fontHeading: "sans",
  radius: 0.5,
};

const COLOR_CSS: Record<ThemeColorKey, string> = {
  accent: "--accent",
  accentForeground: "--accent-foreground",
  background: "--background",
  border: "--border",
  foreground: "--foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  ring: "--ring",
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function record(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return {};
}

function isFontId(value: unknown): value is FontId {
  return (
    typeof value === "string" && (FONT_IDS as readonly string[]).includes(value)
  );
}

export function resolveThemeTokens(partial: unknown): ThemeTokens {
  const input = record(partial);
  const colorsIn = record(input.colors);
  const colors = { ...DEFAULT_THEME_TOKENS.colors };

  for (const key of THEME_COLOR_KEYS) {
    const value = colorsIn[key];
    if (typeof value === "string" && HEX_COLOR.test(value)) {
      colors[key] = value.toLowerCase();
    }
  }

  const { radius: inputRadius } = input;
  const { radius: defaultRadius } = DEFAULT_THEME_TOKENS;
  let radius = defaultRadius;
  if (typeof inputRadius === "number" && inputRadius >= 0 && inputRadius <= 2) {
    radius = inputRadius;
  }

  return {
    colors,
    fontBody: isFontId(input.fontBody)
      ? input.fontBody
      : DEFAULT_THEME_TOKENS.fontBody,
    fontHeading: isFontId(input.fontHeading)
      ? input.fontHeading
      : DEFAULT_THEME_TOKENS.fontHeading,
    radius,
  };
}

export function tokensToCssVariables(tokens: ThemeTokens): string {
  const parts = THEME_COLOR_KEYS.map(
    (key) => `${COLOR_CSS[key]}:${tokens.colors[key]}`
  );
  parts.push(`--radius:${tokens.radius}rem`);
  parts.push(`--font-heading:${FONT_STACKS[tokens.fontHeading]}`);
  parts.push(`--font-body:${FONT_STACKS[tokens.fontBody]}`);
  return `${parts.join(";")};`;
}
