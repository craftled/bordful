import { createHash, timingSafeEqual } from "node:crypto";

export function isAuthorizedCronRequest(
  request: Request,
  secret: string | undefined = process.env.CRON_SECRET
): boolean {
  if (secret === undefined || secret.length === 0) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (header === null) {
    return false;
  }

  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  const actual = createHash("sha256").update(header).digest();
  return timingSafeEqual(expected, actual);
}
