import { strictObject, z } from "payload";
import { defineCLICommand } from "payload/cli";

export const bordfulCommand = defineCLICommand({
  cli: { action: "argument" },
  description: "Connect this board to Bordfeed.",
  handler: () => {
    console.log("not implemented yet (L3b)");
    return 0;
  },
  input: strictObject({
    action: z.enum(["connect", "sample"]),
  }),
});
