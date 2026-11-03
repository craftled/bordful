import { z } from "zod";

const httpsUrl = z.url({ protocol: /^https$/u });

const CRON_FIELD =
  /^(?:\*|(?:\*|\d{1,2})(?:-\d{1,2})?(?:\/\d{1,2})?|\d{1,2}(?:,\d{1,2})*)$/u;
const STEP_FROM_NUMBER = /^\d+\/\d+$/u;

function isFiveFieldCron(value: string): boolean {
  const fields = value.split(" ");
  if (fields.length !== 5) {
    return false;
  }

  return fields.every(
    (field) => !STEP_FROM_NUMBER.test(field) && CRON_FIELD.test(field)
  );
}

function clamp(min: number, max: number) {
  return (value: number) => Math.min(max, Math.max(min, value));
}

// Bordfeed bills up to one credit per job fetched. These caps bound every sync.
export const JOBS_PER_SYNC = { default: 50, max: 100, min: 20 } as const;
export const JOBS_PER_DAY = { default: 200, max: 5000, min: 20 } as const;

const cronSchema = z.string().refine(isFiveFieldCron, {
  message:
    "Enter a 5-field cron expression. Step values must use */N or a-b/N.",
});

export const bordfulConfigSchema = z.strictObject({
  alerts: z
    .strictObject({
      provider: z.literal("resend").prefault("resend"),
    })
    .prefault({}),
  board: z
    .strictObject({
      defaultTemplateId: z.string().min(1).max(100).prefault("fully-remote"),
    })
    .prefault({}),
  bordfeed: z
    .strictObject({
      baseUrl: httpsUrl.prefault("https://bordfeed.com"),
      sync: z
        .strictObject({
          jobsPerDay: z
            .number()
            .int()
            .transform(clamp(JOBS_PER_DAY.min, JOBS_PER_DAY.max))
            .prefault(JOBS_PER_DAY.default),
          jobsPerSync: z
            .number()
            .int()
            .transform(clamp(JOBS_PER_SYNC.min, JOBS_PER_SYNC.max))
            .prefault(JOBS_PER_SYNC.default),
        })
        .prefault({}),
      syncCron: cronSchema.prefault("0 6 * * *"),
    })
    .prefault({}),
  csp: z
    .strictObject({
      extraConnectOrigins: z.array(z.string()).prefault([]),
      extraScriptOrigins: z.array(z.string()).prefault([]),
    })
    .prefault({}),
  social: z
    .strictObject({
      bluesky: httpsUrl.optional(),
      github: httpsUrl.optional(),
      linkedin: httpsUrl.optional(),
      reddit: httpsUrl.optional(),
      x: httpsUrl.optional(),
    })
    .prefault({}),
  telemetry: z
    .strictObject({
      clientHeader: z.boolean().prefault(true),
    })
    .prefault({}),
});

export type BordfulConfig = z.output<typeof bordfulConfigSchema>;
export type BordfulConfigInput = z.input<typeof bordfulConfigSchema>;

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  for (const key of Object.getOwnPropertyNames(value)) {
    const nested: unknown = (value as Record<string, unknown>)[key];
    deepFreeze(nested);
  }

  return Object.freeze(value);
}

export function defineBordfulConfig(input?: BordfulConfigInput): BordfulConfig {
  const parsed = bordfulConfigSchema.safeParse(input ?? {});
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid bordful.config.ts: ${details}`);
  }

  return deepFreeze(parsed.data);
}
