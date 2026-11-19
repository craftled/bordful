import { initBotId } from "botid/client/core";

import { clientInitOptions, type EnvRecord } from "@/lib/sentry/config";

// BotID only works on Vercel: off Vercel its challenge script 404s and the
// protected fetch rejects, which would break signup on self-hosted forks.
// Vercel exposes NEXT_PUBLIC_VERCEL_ENV to the browser; the server check in
// src/lib/alerts/bot-check.ts keys on the same variable so both sides agree.
// The path must match the page that invokes subscribeAction, because server
// actions POST to the current page path.
if (process.env.NEXT_PUBLIC_VERCEL_ENV) {
  initBotId({
    protect: [{ method: "POST", path: "/alerts" }],
  });
}

// Sentry browser SDK, as optional as the server side. With no DSN at build
// the literal check in the if below is falsy, so the SDK never loads on a
// running page. The build may still emit the lazy @sentry chunk: Next does not
// inline an unset NEXT_PUBLIC_* value, so the check stays a runtime read.
const sentryEnv: EnvRecord = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  NEXT_PUBLIC_SENTRY_REPLAY: process.env.NEXT_PUBLIC_SENTRY_REPLAY,
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE:
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
};

const sentryOptions = clientInitOptions(sentryEnv);

// The SDK module once the import has resolved. A router transition before
// then is dropped, which only costs one navigation span.
let sentryClient: typeof import("@sentry/nextjs") | null = null;

if (process.env.NEXT_PUBLIC_SENTRY_DSN && sentryOptions) {
  const options = sentryOptions;
  void import("@sentry/nextjs").then((Sentry) => {
    sentryClient = Sentry;
    const { replay, ...initOptions } = options;
    Sentry.init(
      replay
        ? {
            ...initOptions,
            integrations: [
              Sentry.replayIntegration({
                maskAllText: replay.maskAllText,
                maskAllInputs: replay.maskAllInputs,
                blockAllMedia: replay.blockAllMedia,
              }),
            ],
            replaysSessionSampleRate: replay.replaysSessionSampleRate,
            replaysOnErrorSampleRate: replay.replaysOnErrorSampleRate,
          }
        : initOptions
    );
  });
}

// Next calls this on every App Router navigation. It only forwards once the
// SDK above has loaded; until then it does nothing.
export function onRouterTransitionStart(
  url: string,
  navigationType: string
): void {
  sentryClient?.captureRouterTransitionStart(url, navigationType);
}
