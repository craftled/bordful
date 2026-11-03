import { expect, test } from "vitest";

import { buildPostJobView, isStripeTestLink } from "./post-job-view";

const link = "https://buy.stripe.com/test_example";

test("post a job stays hidden until a payment link is enabled", () => {
  expect(
    buildPostJobView({
      durationDays: 30,
      enabled: false,
      paymentLinkUrl: "",
      priceLabel: "",
    })
  ).toBeNull();
  expect(
    buildPostJobView({
      durationDays: 30,
      enabled: true,
      paymentLinkUrl: "",
      priceLabel: "",
    })
  ).toBeNull();
});

test("a priced link names the price and the listing length", () => {
  expect(
    buildPostJobView({
      durationDays: 30,
      enabled: true,
      paymentLinkUrl: link,
      priceLabel: "$99",
    })
  ).toEqual({
    ctaHref: link,
    ctaLabel: "Post a job for $99",
    durationLabel: "Listed for 30 days",
    priceLabel: "$99",
    testMode: true,
  });
});

test("only a Stripe test link counts as test mode", () => {
  expect(isStripeTestLink("https://buy.stripe.com/test_abc")).toBe(true);
  expect(isStripeTestLink("https://buy.stripe.com/abc")).toBe(false);
  expect(isStripeTestLink("https://example.com/test_abc")).toBe(false);
  expect(isStripeTestLink("not a url")).toBe(false);
});

test("an empty price label uses a plain call to action and singular day", () => {
  expect(
    buildPostJobView({
      durationDays: 1,
      enabled: true,
      paymentLinkUrl: link,
      priceLabel: "",
    })
  ).toEqual({
    ctaHref: link,
    ctaLabel: "Post a job",
    durationLabel: "Listed for 1 day",
    priceLabel: null,
    testMode: true,
  });
});
