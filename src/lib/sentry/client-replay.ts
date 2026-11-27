// biome-ignore-all lint/performance/noBarrelFile: Replay (rrweb) lives in its own chunk, loaded only when NEXT_PUBLIC_SENTRY_REPLAY is "true".
export { replayIntegration } from "@sentry/nextjs";
