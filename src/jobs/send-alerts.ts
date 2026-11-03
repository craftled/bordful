import type { TaskConfig } from "payload";
import { z } from "zod";

import { type DigestRunResult, runAlertDigests } from "@/lib/alerts/digest";
import { resendSender } from "@/lib/alerts/sender";

const inputSchema = z.object({
  now: z.string().optional(),
});

type DigestStore = Map<string, DigestRunResult>;

// The task and the cron route are separate Next bundles, so a module Map
// would not be shared. Payload also deletes the job before runByID returns.
function digestStore(): DigestStore {
  const root = globalThis as typeof globalThis & {
    __bordfulAlertDigestResults?: DigestStore;
  };
  root.__bordfulAlertDigestResults ??= new Map();
  return root.__bordfulAlertDigestResults;
}

export function takeAlertDigestResult(
  id: number | string
): DigestRunResult | null {
  const store = digestStore();
  const result = store.get(String(id)) ?? null;
  store.delete(String(id));
  return result;
}

function digestNow(input: unknown): Date {
  const parsed = inputSchema.safeParse(input ?? {});
  const raw = parsed.success ? parsed.data.now : undefined;
  if (!raw) {
    return new Date();
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export const sendAlertsTask: TaskConfig<"send-alerts"> = {
  handler: async ({ input, job, req }) => {
    const result = await runAlertDigests(req.payload, {
      now: digestNow(input),
      sender: resendSender(process.env.RESEND_API_KEY ?? ""),
    });
    digestStore().set(String(job.id), result);
    return { output: result };
  },
  slug: "send-alerts",
};
