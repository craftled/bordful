import { type BordfulConfig, bordfulConfig } from "@/config";

export function resolveBordfeedBaseUrl(
  env: NodeJS.ProcessEnv | { BORDFEED_BASE_URL?: string } = process.env,
  config: BordfulConfig = bordfulConfig
): string {
  const configured =
    "BORDFEED_BASE_URL" in env && typeof env.BORDFEED_BASE_URL === "string"
      ? env.BORDFEED_BASE_URL
      : undefined;
  const value =
    configured && configured.length > 0 ? configured : config.bordfeed.baseUrl;
  const parsed = new URL(value);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Bordfeed base URL must use http or https.");
  }

  return parsed.origin;
}
