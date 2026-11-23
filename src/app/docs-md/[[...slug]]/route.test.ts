import { afterEach, expect, test, vi } from "vitest";

import {
  docMarkdown,
  docsHtmlPath,
  docsIndexMarkdown,
} from "@/lib/docs/agent-docs";

afterEach(() => {
  vi.unstubAllEnvs();
});

async function get(params: { slug?: string[] }) {
  vi.stubEnv("BORDFUL_MARKETING", "true");
  vi.stubEnv("NEXT_PUBLIC_SERVER_URL", "http://localhost:3000");
  const { GET } = await import("./route");
  return GET(new Request("http://localhost:3000/docs.md"), {
    params: Promise.resolve(params),
  });
}

test("serves a known doc as markdown", async () => {
  const response = await get({ slug: ["deploy"] });
  const siteUrl = "http://localhost:3000";
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe(
    "text/markdown; charset=utf-8"
  );
  expect(response.headers.get("vary")).toBe("Accept");
  expect(response.headers.get("link")).toBe(
    `<${siteUrl}${docsHtmlPath("deploy")}>; rel="canonical"`
  );
  expect(await response.text()).toBe(docMarkdown("deploy", siteUrl));
});

test("the overview slug serves the docs index markdown", async () => {
  const response = await get({ slug: [] });
  const siteUrl = "http://localhost:3000";
  expect(response.status).toBe(200);
  expect(await response.text()).toBe(docsIndexMarkdown(siteUrl));
  expect(response.headers.get("link")).toBe(
    `<${siteUrl}${docsHtmlPath(null)}>; rel="canonical"`
  );
});

test("unknown, nested and traversal slugs 404 in plain text", async () => {
  const responses = await Promise.all(
    [["nope"], ["deploy", "x"], ["../package"]].map(async (slug) => {
      const response = await get({ slug });
      return {
        body: await response.text(),
        contentType: response.headers.get("content-type"),
        status: response.status,
      };
    })
  );
  expect(responses).toHaveLength(3);
  for (const response of responses) {
    expect(response.status).toBe(404);
    expect(response.contentType).toBe("text/plain; charset=utf-8");
    expect(response.body).toBe("Not found\n");
  }
});

test("404s in plain text when marketing is off", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "false");
  const { GET } = await import("./route");
  const response = await GET(new Request("http://localhost:3000/docs.md"), {
    params: Promise.resolve({ slug: ["deploy"] }),
  });
  expect(response.status).toBe(404);
  expect(response.headers.get("content-type")).toBe(
    "text/plain; charset=utf-8"
  );
  expect(await response.text()).toBe("Not found\n");
});
