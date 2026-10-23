import { expect, test } from "vitest";

import { buildCsp } from "./build-csp";
import { createNonce } from "./nonce";

const nonce = "dGVzdG5vbmNlMTIzNDU2Nw==";
const base64Error = /base64/;
const httpsError = /https/;
const base64Value = /^[A-Za-z0-9+/]+=*$/;

const prod =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' 'sha256-eW4XVtkvWTCtmjlnNAPE5rZMcNdfXCcVtmT7b4zs/SM='; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com; upgrade-insecure-requests";

const dev =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' 'sha256-eW4XVtkvWTCtmjlnNAPE5rZMcNdfXCcVtmT7b4zs/SM=' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self' ws:; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com";

const prodWithExtras =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' 'sha256-eW4XVtkvWTCtmjlnNAPE5rZMcNdfXCcVtmT7b4zs/SM=' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self' https://api.example.com; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com; upgrade-insecure-requests";

const devWithExtras =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' 'sha256-eW4XVtkvWTCtmjlnNAPE5rZMcNdfXCcVtmT7b4zs/SM=' 'unsafe-eval' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self' https://api.example.com ws:; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com";

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

const prodWithWildcard =
  "default-src 'self'; script-src 'self' 'nonce-dGVzdG5vbmNlMTIzNDU2Nw==' 'strict-dynamic' 'sha256-eW4XVtkvWTCtmjlnNAPE5rZMcNdfXCcVtmT7b4zs/SM=' https://*.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://*.public.blob.vercel-storage.com https://bordfeed.com https://*.bordfeed.com; font-src 'self' data:; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self' https://buy.stripe.com https://checkout.stripe.com; upgrade-insecure-requests";

test("rejects an origin that contains a double quote", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ['https://evil.example"'],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);
});

test("rejects an origin that contains a space", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ["https://evil.example "],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);
});

test("rejects an origin that contains a comma", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ["https://evil.example,https://other.example"],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);
});

test("rejects an origin that includes a path", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ["https://a.example/path"],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);
});

test("accepts a single leading wildcard label", () => {
  expect(
    buildCsp({
      extraScriptOrigins: ["https://*.example.com"],
      isDev: false,
      nonce,
    })
  ).toBe(prodWithWildcard);
});

test("rejects a bare wildcard origin", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ["https://*"],
      isDev: false,
      nonce,
    })
  ).toThrow(httpsError);
});

test("rejects a wildcard over a single-label suffix", () => {
  expect(() =>
    buildCsp({
      extraScriptOrigins: ["https://*.com"],
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
