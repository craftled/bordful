import type { TaskConfig } from "payload";

export const sendAlertsTask: TaskConfig<"send-alerts"> = {
  handler: () => {
    console.info("send alerts is not implemented yet (L5)");
    return { output: {} };
  },
  slug: "send-alerts",
};
