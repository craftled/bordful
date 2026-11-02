import { z } from "zod";

export const UTM_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
export const INSTALL_ID_PATTERN = /^[a-f0-9]{16,64}$/;

const optionalUtm = z.string().regex(UTM_PATTERN).optional();
const optionalName = z.string().min(1).max(100).optional();

// auth.md: agent_name is 1 to 64 letters, digits, spaces or . _ ( ) -.
const AGENT_NAME = /^[A-Za-z0-9 ._()-]{1,64}$/;

export const registerRequestSchema = z.strictObject({
  agent_name: z.string().regex(AGENT_NAME),
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
  registration_id: z.uuid(),
  workspace: optionalName,
});
