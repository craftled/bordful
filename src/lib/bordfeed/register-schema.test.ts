import { expect, test } from "vitest";

import { registerRequestSchema, verifyRequestSchema } from "./register-schema";

const valid = {
  agent_name: "Bordful",
  board_name: "Example Co",
  email: "ada@example.com",
  install_id:
    "271a413bd339c5709fdceaec41f14f11e9fbfb5042d72d331c65f32b284cd09a",
  ref: "bordful",
  utm_campaign: "connect",
  utm_medium: "admin",
  utm_source: "bordful",
};

test("accepts a bordful registration body", () => {
  expect(registerRequestSchema.safeParse(valid).success).toBe(true);
});

test("rejects a capital utm source, a short install id, and a short code", () => {
  expect(
    registerRequestSchema.safeParse({ ...valid, utm_source: "Bordful" }).success
  ).toBe(false);
  expect(
    registerRequestSchema.safeParse({ ...valid, install_id: "abc" }).success
  ).toBe(false);
  expect(
    verifyRequestSchema.safeParse({
      code: "12345",
      registration_id: "reg_1",
    }).success
  ).toBe(false);
});
