import type { TaskConfig } from "payload";

export const bordfeedSyncTask: TaskConfig<"bordfeed-sync"> = {
  handler: () => {
    console.info("bordfeed sync is not implemented yet (L3a)");
    return { output: {} };
  },
  slug: "bordfeed-sync",
};
