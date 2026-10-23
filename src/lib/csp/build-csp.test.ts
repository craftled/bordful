import { expect, test } from "vitest";

import { buildCsp } from "./build-csp";
import { createNonce } from "./nonce";

const nonce = "dGVzdG5vbmNlMTIzNDU2Nw==";
const base64Error = /base64/;
const httpsError = /https/;
const base64Value = /^[A-Za-z0-9+/]+=*$/;

const prod =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com; upgrade-insecure-requests";

const dev =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self' ws:; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com";

const prodWithExtras =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self' https://api.example.com; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com; upgrade-insecure-requests";

const devWithExtras =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' 'unsafe-eval' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self' https://api.example.com ws:; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com";

test("builds the production policy for a fixed nonce", () => {
  expect(buildCsp({ isDev: false, nonce })).toBe(prod);
});

test("builds the development policy for a fixed nonce", () => {
  expect(buildCsp({ isDev: true, nonce })).toBe(dev);
});

test("appends extra https origins", () => {
  expect(
    buildCsp({
      extraConnectOrigins: ["https://api.example.com"],
      extraScriptOrigins: ["https://cdn.example.com"],
      isDev: false,
      nonce,
    })
  ).toBe(prodWithExtras);

  expect(
    buildCsp({
      extraConnectOrigins: ["https://api.example.com"],
      extraScriptOrigins: ["https://cdn.example.com"],
      isDev: true,
      nonce,
    })
  ).toBe(devWithExtras);
});

test("rejects a nonce that is not base64", () => {
  expect(() => buildCsp({ isDev: false, nonce: "not a nonce" })).toThrow(
    base64Error
  );
});

test("rejects an origin that contains a semicolon or a quote", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ["https://evil.example;default-src"],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);

  expect(() =>
    buildCsp({
      extraConnectOrigins: ["https://evil.example'"],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);
});

test("rejects an http origin", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ["http://example.com"],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);
});

test("createNonce returns distinct base64 values of length 24", () => {
  const first = createNonce();
  const second = createNonce();

  expect(first).toHaveLength(24);
  expect(second).toHaveLength(24);
  expect(first).not.toBe(second);
  expect(first).toMatch(base64Value);
  expect(second).toMatch(base64Value);
});
