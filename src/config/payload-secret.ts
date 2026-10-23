export function resolvePayloadSecret(
  env: Partial<NodeJS.ProcessEnv> = process.env
): string {
  const secret = env.PAYLOAD_SECRET;

  if (env.NODE_ENV === "production") {
    if (secret === undefined || secret.length < 32) {
      throw new Error(
        "PAYLOAD_SECRET must be set to at least 32 characters in production."
      );
    }

    return secret;
  }

  if (secret === undefined || secret.length === 0) {
    throw new Error("PAYLOAD_SECRET is not set.");
  }

  return secret;
}
