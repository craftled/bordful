const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
// x-forwarded-for is caller-controlled off Vercel, so each new value is a key.
const MAX_TRACKED_IPS = 10_000;

const hitsByIp = new Map<string, number[]>();

function liveHits(hits: number[], now: number): number[] {
  return hits.filter((at) => now - at < WINDOW_MS);
}

function enforceCap(now: number): void {
  if (hitsByIp.size <= MAX_TRACKED_IPS) {
    return;
  }

  for (const [ip, hits] of hitsByIp) {
    const recent = liveHits(hits, now);
    if (recent.length === 0) {
      hitsByIp.delete(ip);
      continue;
    }
    if (recent.length !== hits.length) {
      hitsByIp.set(ip, recent);
    }
  }

  if (hitsByIp.size <= MAX_TRACKED_IPS) {
    return;
  }

  const oldest = [...hitsByIp.entries()].sort((left, right) => {
    const leftAt = left[1].at(-1) ?? 0;
    const rightAt = right[1].at(-1) ?? 0;
    return leftAt - rightAt;
  });
  for (const [ip] of oldest) {
    if (hitsByIp.size <= MAX_TRACKED_IPS) {
      break;
    }
    hitsByIp.delete(ip);
  }
}

export function clientIp(header: string | null): string {
  const first = header?.split(",")[0]?.trim();
  if (!first) {
    return "unknown";
  }
  return first;
}

export function subscribeRateLimitSize(): number {
  return hitsByIp.size;
}

export function allowSubscribeIp(ip: string, now = Date.now()): boolean {
  const recent = liveHits(hitsByIp.get(ip) ?? [], now);
  if (recent.length === 0) {
    hitsByIp.delete(ip);
  }
  if (recent.length >= MAX_HITS) {
    hitsByIp.set(ip, recent);
    return false;
  }

  recent.push(now);
  hitsByIp.set(ip, recent);
  if (hitsByIp.size > MAX_TRACKED_IPS) {
    enforceCap(now);
  }
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
