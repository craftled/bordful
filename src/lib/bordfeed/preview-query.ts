import { z } from "zod";

import type { TemplateId } from "./types";

export const PREVIEW_WORKPLACE_TYPES = ["Remote", "Hybrid", "On-site"] as const;

export const previewQuerySchema = z.strictObject({
  category: z.array(z.string().trim().min(1).max(100)).max(3).default([]),
  country_code: z
    .array(z.string().regex(/^[A-Z]{2}$/))
    .max(5)
    .default([]),
  limit: z.number().int().min(1).max(20).default(10),
  workplace_type: z.array(z.enum(PREVIEW_WORKPLACE_TYPES)).max(3).default([]),
});

export type PreviewQuery = z.output<typeof previewQuerySchema>;

export function buildPreviewSearchParams(query: PreviewQuery): URLSearchParams {
  const params = new URLSearchParams();

  for (const value of query.category) {
    params.append("category", value);
  }

  for (const value of query.workplace_type) {
    params.append("workplace_type", value);
  }

  for (const value of query.country_code) {
    params.append("country_code", value);
  }

  params.append("limit", String(query.limit));
  return params;
}

export function buildPreviewUrl(
  baseUrl: string,
  templateId: TemplateId,
  query: PreviewQuery
): string {
  const params = buildPreviewSearchParams(query);
  return `${baseUrl}/api/v1/templates/${encodeURIComponent(templateId)}/preview?${params}`;
}
