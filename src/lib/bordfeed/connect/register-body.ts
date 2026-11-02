import { bordfeedInstallId } from "@/lib/install/install-id";

import { registerRequestSchema } from "../register-schema";
import { isValidBoardName } from "../signup-names";
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
    email: input.email,
    ref: "bordful",
    template_id: input.templateId,
    utm_campaign: "connect",
    utm_medium: input.medium,
    utm_source: "bordful",
  };

  // Live rejects a board_name over 80 characters or one that looks like a
  // domain ("Remote.io"). It is optional, so leave it out and Bordfeed names
  // the workspace from the email instead.
  const boardName = input.boardName.trim();
  if (isValidBoardName(boardName)) {
    body.board_name = boardName;
  }

  if (input.telemetry) {
    body.install_id = bordfeedInstallId(input.installId);
  }

  if (input.workspace) {
    body.workspace = input.workspace;
  }

  return registerRequestSchema.parse(body);
}
