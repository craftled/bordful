import { expect, test } from "vitest";

import { isLogoDevConfigured, logoDevUrl, readLogoDevToken } from "./logo-dev";

const ENV = { NEXT_PUBLIC_LOGO_DEV_TOKEN: "pk_test_123" };

test("only a publishable pk_ key turns Logo.dev on", () => {
  expect(readLogoDevToken({ NEXT_PUBLIC_LOGO_DEV_TOKEN: " pk_abc " })).toBe(
    "pk_abc"
  );
  expect(readLogoDevToken({ NEXT_PUBLIC_LOGO_DEV_TOKEN: "sk_secret" })).toBe(
    null
  );
  expect(readLogoDevToken({ NEXT_PUBLIC_LOGO_DEV_TOKEN: "" })).toBe(null);
  expect(isLogoDevConfigured({})).toBe(false);
  expect(isLogoDevConfigured(ENV)).toBe(true);
});

test("builds a PNG logo URL from a normalized company domain", () => {
  expect(logoDevUrl("Acme.com", ENV)).toBe(
    "https://img.logo.dev/acme.com?format=png&retina=true&size=64&token=pk_test_123"
  );
  expect(logoDevUrl("https://www.acme.com/about", ENV)).toBe(
    "https://img.logo.dev/www.acme.com?format=png&retina=true&size=64&token=pk_test_123"
  );
});

test("returns no URL without a key or a usable domain", () => {
  expect(logoDevUrl("acme.com", {})).toBeNull();
  expect(logoDevUrl(null, ENV)).toBeNull();
  expect(logoDevUrl("", ENV)).toBeNull();
  expect(logoDevUrl("not a domain", ENV)).toBeNull();
  expect(logoDevUrl("acme.com/../x?y", ENV)).toBeNull();
});
