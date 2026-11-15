import { afterEach, expect, test, vi } from "vitest";

import { loadFeedTexts } from "./job-preview";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("a failed feed.json response is retried by the next preview", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response("busy", { status: 503 }))
    .mockResolvedValueOnce(
      Response.json({
        items: [
          {
            content_text: "Build the board.",
            url: "https://board.example/jobs/engineer-acme",
          },
        ],
      })
    );
  vi.stubGlobal("fetch", fetchMock);

  expect((await loadFeedTexts()).size).toBe(0);
  const texts = await loadFeedTexts();

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(texts.get("engineer-acme")).toBe("Build the board.");
  // A good response is kept for every later preview.
  await loadFeedTexts();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
