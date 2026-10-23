export function resolveCronNow(
  request: Request,
  env: Partial<NodeJS.ProcessEnv> = process.env
): Date {
  if (env.BORDFUL_TEST_CLOCK === "true") {
    const raw = new URL(request.url).searchParams.get("now");
    if (raw !== null) {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return new Date();
}
