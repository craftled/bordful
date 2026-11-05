const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
// Off Vercel the address can still be spoofed, so each new value is a key.
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

interface HeaderSource {
  get: (name: string) => string | null;
}

function firstAddress(header: string | null): string | null {
  const first = header?.split(",")[0]?.trim();
  if (!first) {
    return null;
  }
  return first;
}

// On Vercel, x-vercel-forwarded-for and x-real-ip are set by the edge and
// are not caller-controlled. Off Vercel nothing strips x-vercel-forwarded-for,
// so it is only read on Vercel; a fork's proxy can still set x-real-ip.
export function clientIp(
  headers: HeaderSource,
  onVercel = process.env.VERCEL === "1"
): string {
  return (
    (onVercel ? firstAddress(headers.get("x-vercel-forwarded-for")) : null) ??
    firstAddress(headers.get("x-real-ip")) ??
    firstAddress(headers.get("x-forwarded-for")) ??
    "unknown"
  );
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
