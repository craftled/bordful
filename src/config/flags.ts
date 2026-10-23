export function isMarketingEnabled(
  env: Partial<NodeJS.ProcessEnv> = process.env
): boolean {
  return env.BORDFUL_MARKETING === "true";
}
