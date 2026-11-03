import type { TaskConfig } from "payload";

import { runBordfeedSync } from "@/lib/bordfeed/sync";

export const bordfeedSyncTask: TaskConfig<"bordfeed-sync"> = {
  handler: async ({ req }) => {
    const summary = await runBordfeedSync(req.payload);
    return { output: summary };
  },
  slug: "bordfeed-sync",
};
