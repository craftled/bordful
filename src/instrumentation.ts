import type { InstrumentationOnRequestError } from "next/dist/server/instrumentation/types";

import { serverInitOptions } from "@/lib/sentry/config";

// Server and edge SDK init. Sentry is optional: with no SENTRY_DSN the SDK is
// never imported, so a board without Sentry runs no Sentry code here.
export async function register() {
  const runtime = process.env.NEXT_RUNTIME;
  if (runtime !== "nodejs" && runtime !== "edge") {
    return;
  }
  const options = serverInitOptions();
  if (!options) {
    return;
  }
  // One import covers both runtimes: the @sentry/nextjs exports map resolves
  // the package to its server build under node and its edge build under edge.
  const Sentry = await import("@sentry/nextjs");
  Sentry.init(options);
}

// Next calls this for errors in server components, route handlers, server
// actions, and the proxy. Without a DSN it does nothing and stays free of the
// SDK import.
export const onRequestError: InstrumentationOnRequestError = async (
  error,
  request,
  context
) => {
  if (!serverInitOptions()) {
    return;
  }
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(error, request, context);
};
