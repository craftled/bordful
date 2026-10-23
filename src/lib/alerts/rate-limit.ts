const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

const hitsByIp = new Map<string, number[]>();

export function clientIp(header: string | null): string {
  const first = header?.split(",")[0]?.trim();
  if (!first) {
    return "unknown";
  }
  return first;
}

export function allowSubscribeIp(ip: string, now = Date.now()): boolean {
  const recent = (hitsByIp.get(ip) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hitsByIp.set(ip, recent);
    return false;
  }

  recent.push(now);
  hitsByIp.set(ip, recent);
  return true;
}

export function confirmationIsRecent(
  updatedAt: string | null | undefined,
  now: Date
): boolean {
  if (!updatedAt) {
    return false;
  }

  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) {
    return false;
  }

  return now.getTime() - then < WINDOW_MS;
}
