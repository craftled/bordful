const CONNECT_WINDOW_MS = 10 * 60 * 1000;
const CONNECT_LIMIT = 5;
const VERIFY_LIMIT = 10;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

const connectHits = new Map<string, number[]>();
const verifyHits = new Map<string, { count: number; startedAt: number }>();

function pruneVerifyHits(now: number): void {
  for (const [key, hit] of verifyHits) {
    if (now - hit.startedAt >= VERIFY_WINDOW_MS) {
      verifyHits.delete(key);
    }
  }
}

// Best effort per server instance. Another process keeps its own counters.
export function allowConnectAttempt(userId: string, now = Date.now()): boolean {
  const recent = (connectHits.get(userId) ?? []).filter(
    (at) => now - at < CONNECT_WINDOW_MS
  );
  if (recent.length >= CONNECT_LIMIT) {
    connectHits.set(userId, recent);
    return false;
  }

  recent.push(now);
  connectHits.set(userId, recent);
  return true;
}

export function allowVerifyAttempt(
  registrationId: string,
  now = Date.now()
): boolean {
  pruneVerifyHits(now);
  const hit = verifyHits.get(registrationId);
  if (!hit || now - hit.startedAt >= VERIFY_WINDOW_MS) {
    verifyHits.set(registrationId, { count: 1, startedAt: now });
    return true;
  }

  if (hit.count >= VERIFY_LIMIT) {
    return false;
  }

  hit.count += 1;
  return true;
}

export function clearVerifyAttempts(registrationId: string): void {
  verifyHits.delete(registrationId);
}
