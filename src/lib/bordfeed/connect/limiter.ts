const CONNECT_WINDOW_MS = 10 * 60 * 1000;
const CONNECT_LIMIT = 5;
const VERIFY_LIMIT = 10;

const connectHits = new Map<string, number[]>();
const verifyHits = new Map<string, number>();

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

export function allowVerifyAttempt(registrationId: string): boolean {
  const count = verifyHits.get(registrationId) ?? 0;
  if (count >= VERIFY_LIMIT) {
    return false;
  }

  verifyHits.set(registrationId, count + 1);
  return true;
}
