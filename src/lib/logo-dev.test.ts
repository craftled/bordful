import { expect, test } from "vitest";

import {
  isLogoDevConfigured,
  logoDevUrl,
  pickCompanyLogoUrl,
  readLogoDevToken,
} from "./logo-dev";

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

const FAKE_ENV = { NEXT_PUBLIC_LOGO_DEV_TOKEN: "pk_test_not_a_real_token" };
const ACME_LOGO_DEV =
  "https://img.logo.dev/acme.com?format=png&retina=true&size=64&token=pk_test_not_a_real_token";
const BORDFEED_LOGO = "https://cdn.bordfeed.com/logos/acme.png";
const WORKDAY_LOGO = "https://example.myworkdayjobs.com/logo.png";

test("Logo.dev by domain wins over a logo URL when a key is set", () => {
  expect(
    pickCompanyLogoUrl({ domain: "acme.com", logoUrl: BORDFEED_LOGO }, FAKE_ENV)
  ).toBe(ACME_LOGO_DEV);
  expect(
    pickCompanyLogoUrl({ domain: "acme.com", logoUrl: WORKDAY_LOGO }, FAKE_ENV)
  ).toBe(ACME_LOGO_DEV);
});

test("with no domain, a logo URL on an img-src host is used", () => {
  expect(
    pickCompanyLogoUrl({ domain: null, logoUrl: BORDFEED_LOGO }, FAKE_ENV)
  ).toBe(BORDFEED_LOGO);
  expect(
    pickCompanyLogoUrl({ domain: null, logoUrl: ACME_LOGO_DEV }, FAKE_ENV)
  ).toBe(ACME_LOGO_DEV);
});

test("with no domain, a logo URL on a blocked host gives the letter tile", () => {
  expect(
    pickCompanyLogoUrl({ domain: null, logoUrl: WORKDAY_LOGO }, FAKE_ENV)
  ).toBeNull();
  expect(pickCompanyLogoUrl({ domain: null, logoUrl: WORKDAY_LOGO }, {})).toBe(
    null
  );
});

test("with no domain and no logo URL, the letter tile shows", () => {
  expect(pickCompanyLogoUrl({ domain: null, logoUrl: null }, FAKE_ENV)).toBe(
    null
  );
  expect(pickCompanyLogoUrl({ domain: null, logoUrl: "" }, FAKE_ENV)).toBe(
    null
  );
});

test("without a Logo.dev key, an allowed logo URL is used", () => {
  expect(
    pickCompanyLogoUrl({ domain: "acme.com", logoUrl: BORDFEED_LOGO }, {})
  ).toBe(BORDFEED_LOGO);
  expect(
    pickCompanyLogoUrl({ domain: "acme.com", logoUrl: WORKDAY_LOGO }, {})
  ).toBeNull();
});
