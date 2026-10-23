import type { TaskConfig } from "payload";

export interface ValidThroughInput {
  durationDays: number;
  origin: string;
  publishedAt: string | null;
  validThrough: string | null;
}

export function computeValidThrough(args: ValidThroughInput): string | null {
  return args.validThrough;
}

export const expireJobsTask: TaskConfig<"expire-jobs"> = {
  handler: () => {
    console.info("expire jobs is not implemented yet (L4)");
    return { output: {} };
  },
  slug: "expire-jobs",
};
