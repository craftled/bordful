export function resolveServerUrl(
  env: Partial<NodeJS.ProcessEnv> = process.env
): string {
  let url = "http://localhost:3000";

  if (env.NEXT_PUBLIC_SERVER_URL) {
    url = env.NEXT_PUBLIC_SERVER_URL;
  } else if (
    env.VERCEL_ENV === "production" &&
    env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    url = `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (env.VERCEL_URL) {
    url = `https://${env.VERCEL_URL}`;
  }

  return url.endsWith("/") ? url.slice(0, -1) : url;
}
