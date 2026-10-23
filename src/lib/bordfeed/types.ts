import type { PreviewQuery } from "./preview-query";

export type { JobOrigin } from "@/lib/domain/job-vocab";

export type TemplateId = string;

export type SafeErrorCode =
  | "auth_failed"
  | "not_found"
  | "payment_required"
  | "rate_limited"
  | "network"
  | "invalid_response"
  | "workspace_required"
  | "already_issued"
  | "unknown";

export interface SafeError {
  at: string;
  code: SafeErrorCode;
  message: string;
}

export type BordfeedConnection =
  | { state: "sample"; templateId: TemplateId }
  | {
      state: "awaiting_code";
      templateId: TemplateId;
      registrationId: string;
      registrationExpiresAt: string;
    }
  | {
      state: "connected";
      templateId: TemplateId;
      feedId: string;
      apiKeyEncrypted: string;
      keyHint: string;
      lastSyncAt: string | null;
      showAttribution: boolean;
    }
  | {
      state: "error";
      previous: "sample" | "connected";
      lastError: SafeError;
    };

export type BordfeedConnectionState = BordfeedConnection["state"];

export interface BordfeedTemplate {
  category: string;
  description: string;
  filters: Record<string, unknown>;
  id: string;
  name: string;
}

export interface TemplatesResponse {
  data: BordfeedTemplate[];
  request_id: string;
}

export interface BordfeedAttribution {
  logo_url: string;
  text: string;
  url: string;
}

export interface PreviewResponse<TJob = unknown> {
  attribution?: BordfeedAttribution;
  data: TJob[];
  filters_applied?: Partial<PreviewQuery>;
  message: string;
  preview: true;
  request_id: string;
  template: Omit<BordfeedTemplate, "category">;
}

export interface RegisterRequest {
  agent_name: string;
  board_name: string;
  email: string;
  install_id?: string;
  ref?: string;
  template_id?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_source?: string;
  workspace?: string;
}

export interface VerifyRequest {
  code: string;
  registration_id: string;
}

export interface SuggestedFeed {
  name?: string;
  template_id?: string;
  [key: string]: unknown;
}

export interface BordfeedErrorBody<TCode extends string = string> {
  error: {
    code: TCode;
    message: string;
    errors?: unknown[];
    retry_after?: number;
  };
  request_id?: string;
}

export interface BordfeedWorkspace {
  name: string;
  slug: string;
}

// Provisional: confirm against the Bordfeed mock in L3a
export type WorkspaceRequiredError = BordfeedErrorBody<"workspace_required"> & {
  error: { workspaces: BordfeedWorkspace[] };
};

// Provisional: confirm against the Bordfeed mock in L3a
export type AlreadyIssuedError = BordfeedErrorBody<"already_issued"> & {
  status: 409;
};

export type AgentError =
  | WorkspaceRequiredError
  | AlreadyIssuedError
  | BordfeedErrorBody;

export interface CreateFeedRequest {
  name: string;
  template_id: string;
}

// Provisional: confirm against the Bordfeed mock in L3a
export interface RegisterResponse {
  expires_at: string;
  registration_id: string;
}

// Provisional: confirm against the Bordfeed mock in L3a
export interface VerifyResponse {
  api_key: string;
  suggested_feed?: SuggestedFeed | null;
}
