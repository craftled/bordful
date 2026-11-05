import { initBotId } from "botid/client/core";

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
