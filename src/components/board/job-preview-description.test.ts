import { afterEach, expect, test, vi } from "vitest";

import { loadDescription } from "./job-preview";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("a failed preview request is retried, a good one is kept", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response("busy", { status: 503 }))
    .mockResolvedValueOnce(Response.json({ text: "Build the board." }));
  vi.stubGlobal("fetch", fetchMock);

  expect(await loadDescription("engineer-acme")).toBe("");
  expect(await loadDescription("engineer-acme")).toBe("Build the board.");
  expect(await loadDescription("engineer-acme")).toBe("Build the board.");

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenLastCalledWith(
    "/api/job-preview/engineer-acme",
    expect.anything()
  );
});
