import { z } from "zod";

export const UTM_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
export const INSTALL_ID_PATTERN = /^[a-f0-9]{16,64}$/;

const optionalUtm = z.string().regex(UTM_PATTERN).optional();
const optionalName = z.string().min(1).max(100).optional();

export const registerRequestSchema = z.strictObject({
  agent_name: z.string().min(1).max(100),
  board_name: z.string().min(1).max(100),
  email: z.email(),
  install_id: z.string().regex(INSTALL_ID_PATTERN).optional(),
  ref: optionalUtm,
  template_id: optionalName,
  utm_campaign: optionalUtm,
  utm_medium: optionalUtm,
  utm_source: optionalUtm,
  workspace: optionalName,
});

export const verifyRequestSchema = z.strictObject({
  code: z.string().regex(/^\d{6}$/),
  registration_id: z.string().min(1).max(200),
});
