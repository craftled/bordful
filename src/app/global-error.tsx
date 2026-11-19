"use client";

import DefaultGlobalError from "next/dist/client/components/builtin/global-error";
import { useEffect } from "react";

import { readDsn } from "@/lib/sentry/config";

// global-error replaces the root layout. Next's built-in page renders its own
// html and body, so this file does not need them. Without a browser DSN the
// effect reports nothing and users see Next's default error page unchanged.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // The literal check stops the SDK import at run time when the DSN is
    // unset. readDsn also rejects a whitespace-only value.
    if (
      process.env.NEXT_PUBLIC_SENTRY_DSN &&
      readDsn(process.env.NEXT_PUBLIC_SENTRY_DSN)
    ) {
      void import("@sentry/nextjs").then((Sentry) => {
        Sentry.captureException(error);
      });
    }
  }, [error]);

  return <DefaultGlobalError error={error} />;
}
