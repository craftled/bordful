// biome-ignore-all lint/performance/noBarrelFile: named re-exports let the bundler drop Replay from the default browser SDK chunk.
export {
  captureException,
  captureRouterTransitionStart,
  init,
} from "@sentry/nextjs";
