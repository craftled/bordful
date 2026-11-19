"use client";

import NextError from "next/error";
import { useEffect } from "react";

import { readDsn } from "@/lib/sentry/config";

// global-error replaces the root layout, so it renders its own html and body.
// Without a browser DSN the effect reports nothing and the page users see is
// Next's default, with no extra copy or styling.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    const dsn = readDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
    if (!dsn) {
      return;
    }
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* NextError is the default Next.js error page component. Its type
        wants a statusCode prop, but the App Router exposes no status code
        here, so 0 renders the generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
