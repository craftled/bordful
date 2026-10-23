import { expect, type Page, test } from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { createJob, docString } from "./support/seed";

interface RssSummary {
  channel: boolean;
  links: string[];
  self: string;
  version: string | null;
}

function rssSummary(page: Page, xml: string): Promise<RssSummary> {
  return page.evaluate((source) => {
    const doc = new DOMParser().parseFromString(source, "text/xml");
    const atomLinks = doc.getElementsByTagNameNS(
      "http://www.w3.org/2005/Atom",
      "link"
    );
    let self = "";
    for (const node of atomLinks) {
      if (node.getAttribute("rel") === "self") {
        self = node.getAttribute("href") ?? "";
      }
    }
    const links: string[] = [];
    for (const node of doc.querySelectorAll("item > link")) {
      links.push(node.textContent ?? "");
    }
    return {
      channel: doc.querySelector("channel") !== null,
      links,
      self,
      version: doc.documentElement.getAttribute("version"),
    };
  }, xml);
}

test.describe("E5 feeds-and-sitemaps", { tag: ["@E5"] }, () => {
  test("lists a live job and drops it after validThrough passes", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const admin = await ensureAdmin(request);
    const created = await createJob(admin, {
      _status: "published",
      companyName: "E5zq Example Co",
      origin: "manual",
      title: "E5zq Feed Role",
    });
    const slug = docString(created, "slug");
    const id = docString(created, "id");
    const samples = await admin.get(
      "/api/jobs?limit=100&where[origin][equals]=bordfeed_sample"
    );
    expect(samples.ok()).toBe(true);
    const sampleBody = (await samples.json()) as { docs?: { slug?: string }[] };
    const sampleSlugs = (sampleBody.docs ?? [])
      .map((doc) => doc.slug)
      .filter((value): value is string => typeof value === "string");

    const feed = await request.get("/feed.xml");
    expect(feed.status()).toBe(200);
    expect(feed.headers()["content-type"] ?? "").toContain(
      "application/rss+xml"
    );
    const rss = await rssSummary(page, await feed.text());
    expect(rss.version).toBe("2.0");
    expect(rss.channel).toBe(true);
    expect(rss.self).toContain("/feed.xml");
    expect(rss.links.some((link) => link.endsWith(`/jobs/${slug}`))).toBe(true);

    const jsonFeed = await request.get("/feed.json");
    expect(jsonFeed.ok()).toBe(true);
    const feedBody = (await jsonFeed.json()) as {
      items: { url: string }[];
      version: string;
    };
    expect(feedBody.version).toBe("https://jsonfeed.org/version/1.1");
    expect(
      feedBody.items.some((item) => item.url.endsWith(`/jobs/${slug}`))
    ).toBe(true);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
    const sitemapText = await sitemap.text();
    expect(sitemapText).toContain(`/jobs/${slug}`);
    for (const sampleSlug of sampleSlugs) {
      expect(sitemapText).not.toContain(`/jobs/${sampleSlug}`);
    }

    const past = new Date(Date.now() - 60_000).toISOString();
    const patched = await admin.patch(`/api/jobs/${id}`, {
      data: { validThrough: past },
    });
    expect(patched.ok()).toBe(true);

    const expiredFeed = await rssSummary(
      page,
      await (await request.get("/feed.xml")).text()
    );
    expect(
      expiredFeed.links.some((link) => link.endsWith(`/jobs/${slug}`))
    ).toBe(false);
    const expiredJson = (await (await request.get("/feed.json")).json()) as {
      items: { url: string }[];
    };
    expect(
      expiredJson.items.some((item) => item.url.endsWith(`/jobs/${slug}`))
    ).toBe(false);
    const expiredSitemap = await (await request.get("/sitemap.xml")).text();
    expect(expiredSitemap).not.toContain(`/jobs/${slug}`);

    const atom = await request.get("/atom.xml", { maxRedirects: 0 });
    expect(atom.status()).toBe(301);
    const location = atom.headers().location ?? "";
    expect(new URL(location, "http://127.0.0.1").pathname).toBe("/feed.xml");
    await admin.dispose();
  });
});
