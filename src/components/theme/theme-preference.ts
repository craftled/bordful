export type ThemePreference = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "bordful:theme";

const ORDER: readonly ThemePreference[] = ["system", "light", "dark"];

/** The next choice when the toggle is pressed: system, light, dark, repeat. */
export function nextThemePreference(current: ThemePreference): ThemePreference {
  return ORDER[(ORDER.indexOf(current) + 1) % ORDER.length] ?? "system";
}

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" ? value : "system";
}
