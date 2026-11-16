import { beforeEach, expect, test, vi } from "vitest";

const getJobBySlug = vi.hoisted(() => vi.fn());

vi.mock("@/lib/read", () => ({ getJobBySlug }));

const { GET } = await import("./route");

function get(slug: string): Promise<Response> {
  return GET(new Request(`http://x/api/job-preview/${slug}`), {
    params: Promise.resolve({ slug }),
  });
}

function paragraph(text: string) {
  return {
    children: [{ text, type: "text", version: 1 }],
    type: "paragraph",
    version: 1,
  };
}

beforeEach(() => {
  getJobBySlug.mockReset();
});

test.each(["Engineer-Acme", "engineer--acme", "../admin", ""])(
  "malformed slug %j is a 404 without a job read",
  async (slug) => {
    const response = await get(slug);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not found" });
    expect(getJobBySlug).not.toHaveBeenCalled();
  }
);

test("an unknown slug is a 404", async () => {
  getJobBySlug.mockResolvedValue(null);
  const response = await get("no-such-job");
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "not found" });
  expect(getJobBySlug).toHaveBeenCalledWith("no-such-job");
});

test("a sample job returns only its plain description text", async () => {
  getJobBySlug.mockResolvedValue({
    applyUrl: "https://example.com/apply",
    company: { name: "Acme" },
    description: {
      root: {
        children: [paragraph("Build the board."), paragraph("Ship it weekly.")],
        type: "root",
        version: 1,
      },
    },
    slug: "engineer-acme",
    source: "bordfeed-sample",
    title: "Engineer",
  });
  const response = await get("engineer-acme");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    text: "Build the board. Ship it weekly.",
  });
});
