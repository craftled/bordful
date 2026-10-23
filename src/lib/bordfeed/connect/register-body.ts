import { bordfeedInstallId } from "@/lib/install/install-id";

import { registerRequestSchema } from "../register-schema";
import type { RegisterRequest } from "../types";

export function buildRegisterBody(input: {
  boardName: string;
  email: string;
  installId: string;
  medium: "admin" | "cli";
  telemetry: boolean;
  templateId: string;
  workspace?: string;
}): RegisterRequest {
  const body: RegisterRequest = {
    agent_name: "bordful",
    board_name: input.boardName.trim().slice(0, 100),
    email: input.email,
    ref: "bordful",
    template_id: input.templateId,
    utm_campaign: "connect",
    utm_medium: input.medium,
    utm_source: "bordful",
  };

  if (input.telemetry) {
    body.install_id = bordfeedInstallId(input.installId);
  }

  if (input.workspace) {
    body.workspace = input.workspace;
  }

  return registerRequestSchema.parse(body);
}
