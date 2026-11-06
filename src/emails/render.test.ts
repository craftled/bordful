import { expect, test } from "vitest";

import type { JobListItem } from "@/lib/read/types";

import { DEFAULT_THEME_TOKENS } from "@/theme/tokens";

import { emailBrand } from "./brand";
import { renderConfirmEmail } from "./confirm";
import { renderDigestEmail } from "./digest";

function card(overrides: Partial<JobListItem>): JobListItem {
  return {
    careerLevel: [],
    categories: [],
    companyLogoUrl: null,
    companyName: "Example Co",
    companySlug: "example-co",
    countryCode: null,
    employmentType: "full-time",
    featured: false,
    id: overrides.slug ?? "1",
    indexable: true,
    languages: [],
    locationDisplay: "Remote",
    origin: "manual",
    publishedAt: "2026-10-20T09:00:00.000Z",
    remoteRegion: null,
    salaryCurrency: null,
    salaryMax: null,
    salaryMaxUsd: null,
    salaryMin: null,
    salaryMinUsd: null,
    seniority: null,
    slug: "job",
    title: "Example Role",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: "remote",
    ...overrides,
  };
}

const jobA = card({
  companyName: "Example Co",
  locationDisplay: "Remote",
  slug: "a",
  title: "<b>R&D</b>",
});
const jobB = card({
  companyName: "Acme Example Ltd",
  employmentType: "contract",
  locationDisplay: "Berlin",
  slug: "b",
  title: "Example Contract Role",
  workplaceType: "hybrid",
});

const brand = emailBrand(
  { logoUrl: null, name: "Example Board", theme: DEFAULT_THEME_TOKENS },
  "https://board.example/",
  false
);

function brandWith(
  logoUrl: string | null,
  marketing = false,
  name = "Example Board"
) {
  return emailBrand(
    { logoUrl, name, theme: DEFAULT_THEME_TOKENS },
    "https://board.example",
    marketing
  );
}

const unsubscribeUrl = "https://board.example/alerts/unsubscribe?token=t";

test("renderDigestEmail escapes titles and links each job", () => {
  const rendered = renderDigestEmail({
    brand,
    frequency: "weekly",
    jobs: [jobA, jobB],
    unsubscribeUrl,
  });

  expect(rendered.subject).toBe("2 new jobs on Example Board");
  expect(rendered.text).toContain("https://board.example/jobs/a");
  expect(rendered.text).toContain("View all jobs: https://board.example/jobs");
  expect(rendered.text).toContain(`Unsubscribe: ${unsubscribeUrl}`);
  expect(rendered.html).toContain("&lt;b&gt;R&amp;D&lt;/b&gt;");
  expect(rendered.html).toContain('href="https://board.example/jobs/b"');
  expect(rendered.html).toContain("Acme Example Ltd · Berlin");
  expect(rendered.html).toContain('href="https://board.example/jobs"');
  expect(
    renderDigestEmail({
      brand,
      frequency: "weekly",
      jobs: [jobA],
      unsubscribeUrl,
    }).subject
  ).toBe("1 new job on Example Board");
});

test("renderDigestEmail links the unsubscribe page in the footer", () => {
  const rendered = renderDigestEmail({
    brand,
    frequency: "daily",
    jobs: [jobA],
    unsubscribeUrl: "https://board.example/alerts/unsubscribe?token=t&x=1",
  });

  expect(rendered.html).toContain(
    'href="https://board.example/alerts/unsubscribe?token=t&amp;x=1"'
  );
  expect(rendered.html).toContain(">Unsubscribe</a>");
  expect(rendered.html).toContain("this daily digest");
});

test("renderConfirmEmail keeps the subject and drops Georgia", () => {
  const rendered = renderConfirmEmail({
    brand,
    confirmUrl: "https://board.example/alerts/confirm?token=t",
  });

  expect(rendered.subject).toBe("Confirm your job alerts on Example Board");
  expect(rendered.html).not.toContain("Georgia");
  expect(rendered.html).toContain("font-family:Geist,-apple-system,");
  expect(rendered.html).toContain('<meta name="color-scheme" content="light">');
  expect(rendered.text).toContain(
    "Open this link, then press Confirm on the page:\nhttps://board.example/alerts/confirm?token=t"
  );
});

test("renderConfirmEmail buttons to the escaped confirm URL in the theme color", () => {
  const rendered = renderConfirmEmail({
    brand: emailBrand(
      {
        logoUrl: null,
        name: "Example Board",
        theme: {
          ...DEFAULT_THEME_TOKENS,
          colors: {
            ...DEFAULT_THEME_TOKENS.colors,
            primary: "#0a7cff",
            primaryForeground: "#fafafa",
          },
          radius: 0.75,
        },
      },
      "https://board.example",
      false
    ),
    confirmUrl: 'https://board.example/alerts/confirm?token=a&b="c"',
  });

  expect(rendered.html).toContain(
    '<td align="center" bgcolor="#0a7cff" style="background-color:#0a7cff;border:1px solid #0a7cff;mso-padding-alt:11px 20px;border-radius:12px;">'
  );
  expect(rendered.html).toContain(
    '<a href="https://board.example/alerts/confirm?token=a&amp;b=&quot;c&quot;" target="_blank"'
  );
  expect(rendered.html).toContain("color:#fafafa;");
  expect(rendered.html).toContain(">Confirm job alerts</a>");
});

test("renderConfirmEmail escapes a hostile site name and site URL", () => {
  const rendered = renderConfirmEmail({
    brand: emailBrand(
      { logoUrl: null, name: 'R&D <Jobs> "x"', theme: DEFAULT_THEME_TOKENS },
      'https://board.example/"><script>alert(1)</script>',
      false
    ),
    confirmUrl: "https://board.example/alerts/confirm?token=t",
  });

  expect(rendered.subject).toBe('Confirm your job alerts on R&D <Jobs> "x"');
  expect(rendered.html).toContain("R&amp;D &lt;Jobs&gt; &quot;x&quot;");
  expect(rendered.html).toContain(
    'href="https://board.example/&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"'
  );
  expect(rendered.html).not.toContain("<Jobs>");
  expect(rendered.html).not.toContain("<script>");
  expect(rendered.text).toContain('R&D <Jobs> "x"');
});

test("emailBrand prefers the Site settings logo and resolves it against the site", () => {
  expect(brandWith("https://cdn.example/logo.png", true).logoUrl).toBe(
    "https://cdn.example/logo.png"
  );
  expect(brandWith("/api/media/file/logo-card.png").logoUrl).toBe(
    "https://board.example/api/media/file/logo-card.png"
  );
});

test("emailBrand falls back to the Bordful PNG only on bordful.com", () => {
  expect(brandWith(null, true).logoUrl).toBe(
    "https://board.example/marketing/apple-icon.png"
  );
  expect(brandWith(null, false).logoUrl).toBeNull();
});

test("emailBrand rejects logos that are not http(s) PNG-friendly URLs", () => {
  expect(brandWith("javascript:alert(1)").logoUrl).toBeNull();
  expect(brandWith("data:image/png;base64,AAAA").logoUrl).toBeNull();
  expect(brandWith("https://cdn.example/logo.svg").logoUrl).toBeNull();
  expect(brandWith("javascript:alert(1)", true).logoUrl).toBe(
    "https://board.example/marketing/apple-icon.png"
  );
});

function themed(
  colors: Partial<typeof DEFAULT_THEME_TOKENS.colors>,
  radius = 0.5
) {
  return emailBrand(
    {
      logoUrl: null,
      name: "Example Board",
      theme: {
        ...DEFAULT_THEME_TOKENS,
        colors: { ...DEFAULT_THEME_TOKENS.colors, ...colors },
        radius,
      },
    },
    "https://board.example",
    false
  );
}

const confirmUrl = "https://board.example/alerts/confirm?token=t";
const FILLER = "&zwnj;&nbsp;".repeat(80);

test("emailBrand only keeps logos Outlook can show", () => {
  expect(brandWith("https://cdn.example/logo.webp").logoUrl).toBeNull();
  expect(brandWith("https://cdn.example/logo.avif").logoUrl).toBeNull();
  expect(brandWith("https://cdn.example/logo").logoUrl).toBeNull();
  expect(brandWith("https://cdn.example/logo.JPEG?v=2").logoUrl).toBe(
    "https://cdn.example/logo.JPEG?v=2"
  );
  expect(brandWith("https://cdn.example/logo.gif").logoUrl).toBe(
    "https://cdn.example/logo.gif"
  );
  expect(brandWith("https://cdn.example/logo.webp", true).logoUrl).toBe(
    "https://board.example/marketing/apple-icon.png"
  );
});

test("the header shows an unsquashed logo and escapes the site name and logo URL", () => {
  const withLogo = renderConfirmEmail({
    brand: brandWith(
      'https://cdn.example/logo.png?a=1&b="2"',
      false,
      'R&D "Jobs"'
    ),
    confirmUrl,
  }).html;
  const nameOnly = renderConfirmEmail({
    brand: brandWith(null),
    confirmUrl,
  }).html;

  expect(withLogo).toContain(
    '<img src="https://cdn.example/logo.png?a=1&amp;b=%222%22" alt="" height="24" style="display:block;height:24px;width:auto;max-width:160px;'
  );
  expect(withLogo).not.toContain('width="24"');
  expect(withLogo).toContain(">R&amp;D &quot;Jobs&quot;</a>");
  expect(nameOnly).not.toContain("<img");
  expect(nameOnly).toContain(">Example Board</a>");
});

test("the button pads the cell for Outlook and keeps the link padded elsewhere", () => {
  const { html } = renderConfirmEmail({ brand, confirmUrl });

  expect(html).toContain("mso-padding-alt:11px 20px;");
  expect(html).toContain("display:inline-block;padding:11px 20px;");
});

test("a zero radius renders square buttons", () => {
  const { html } = renderConfirmEmail({
    brand: themed({}, 0),
    confirmUrl,
  });

  expect(html).toContain("border-radius:0px;");
  expect(html).not.toContain("border-radius:8px;");
});

test("a primary close to the white card borders with the card border", () => {
  const light = renderConfirmEmail({
    brand: themed({ primary: "#f5f5f5", primaryForeground: "#111111" }),
    confirmUrl,
  }).html;
  const dark = renderConfirmEmail({
    brand: themed({ primary: "#0a7cff", primaryForeground: "#fafafa" }),
    confirmUrl,
  }).html;

  expect(light).toContain(
    `background-color:#f5f5f5;border:1px solid ${DEFAULT_THEME_TOKENS.colors.border};`
  );
  expect(dark).toContain("background-color:#0a7cff;border:1px solid #0a7cff;");
});

test("both emails end the preheader with filler and the confirm one differs from the intro", () => {
  const confirm = renderConfirmEmail({ brand, confirmUrl });
  const digest = renderDigestEmail({
    brand,
    frequency: "weekly",
    jobs: [jobB, jobA],
    unsubscribeUrl,
  });

  expect(confirm.html).toContain(
    `>Confirm your address to start getting new jobs.${FILLER}</div>`
  );
  expect(confirm.html).not.toContain(
    `mso-hide:all;">Confirm this address to get new jobs`
  );
  expect(digest.html).toContain(
    `>Example Contract Role, &lt;b&gt;R&amp;D&lt;/b&gt;${FILLER}</div>`
  );
});

test("digest rows cope with a missing company and a missing location", () => {
  const rendered = renderDigestEmail({
    brand,
    frequency: "weekly",
    jobs: [
      card({ companyName: "  ", locationDisplay: "Berlin", slug: "x" }),
      card({
        companyName: "\u{1F600} Smile Co",
        locationDisplay: null,
        slug: "y",
      }),
    ],
    unsubscribeUrl,
  });

  expect(rendered.html).toContain(">Company not listed · Berlin</span>");
  expect(rendered.html).toContain(">?</td>");
  expect(rendered.html).toContain(">\u{1F600} Smile Co</span>");
  expect(rendered.html).toContain(">\u{1F600}</td>");
  expect(rendered.text).toContain("Location not listed");
});

test("renderDigestEmail says how to change filters", () => {
  const rendered = renderDigestEmail({
    brand,
    frequency: "weekly",
    jobs: [],
    unsubscribeUrl: "https://board.example/alerts/unsubscribe?token=t",
  });

  expect(rendered.text).toContain(
    `To change your filters, unsubscribe and sign up again: ${brand.siteUrl}/alerts`
  );
  expect(rendered.html).toContain(`href="${brand.siteUrl}/alerts"`);
});
