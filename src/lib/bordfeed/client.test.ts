import { expect, test } from "vitest";
import { createBordfeedClient } from "./client";
import { BordfeedApiError } from "./errors";
import { previewQuerySchema } from "./preview-query";

const FEED = "11111111-1111-4111-8111-111111111111";
const KEY = `bf_${"test_key_0001"}`;
const JOBS = `http://bf.test/api/v1/feeds/${FEED}/jobs?limit=100&include=description_html`;

interface Call {
  headers: Record<string, string>;
  url: string;
}

function lowerHeaders(
  headers: HeadersInit | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  const source = new Headers(headers);
  source.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...headers },
    status,
  });
}

function job(id: string) {
  return { id, title: `Role ${id}` };
}

function page(
  ids: string[],
  pagination: {
    has_more: boolean;
    next_cursor: string | null;
    next_offset?: number | null;
  }
) {
  return {
    data: ids.map((id) => job(id)),
    pagination: { limit: 100, ...pagination },
    request_id: "req_page",
  };
}

function clock() {
  let time = 0;
  const sleeps: number[] = [];
  return {
    now: () => time,
    sleep: (ms: number) => {
      sleeps.push(ms);
      time += ms;
      return Promise.resolve();
    },
    sleeps,
  };
}

function client(options: {
  fetch: typeof fetch;
  now: () => number;
  sleep: (ms: number) => Promise<void>;
}) {
  return createBordfeedClient({
    apiKey: KEY,
    baseUrl: "http://bf.test",
    clientHeaders: { "X-Bordfeed-Client": "bordful/1.0.0-beta.1" },
    fetch: options.fetch,
    now: options.now,
    sleep: options.sleep,
  });
}

test("listFeedJobs follows cursors with the pinned query order", async () => {
  const calls: Call[] = [];
  const time = clock();
  const bodies = [
    page(["a"], { has_more: true, next_cursor: "c2" }),
    page(["b"], { has_more: true, next_cursor: "c3" }),
    page(["c"], { has_more: false, next_cursor: null }),
  ];
  const fetchImpl: typeof fetch = (input, init) => {
    calls.push({ headers: lowerHeaders(init?.headers), url: String(input) });
    const body = bodies.shift();
    return Promise.resolve(jsonResponse(body));
  };
  const pages: string[][] = [];
  for await (const batch of client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).listFeedJobs(FEED)) {
    pages.push(batch.map((item) => item.id));
  }

  expect(calls.map((call) => call.url)).toEqual([
    JOBS,
    `${JOBS}&cursor=c2`,
    `${JOBS}&cursor=c3`,
  ]);
  expect(pages).toEqual([["a"], ["b"], ["c"]]);
  expect(calls[0]?.headers.authorization).toBe(`Bearer ${KEY}`);
  expect(calls[0]?.headers["x-bordfeed-client"]).toBe("bordful/1.0.0-beta.1");
});

test("listFeedJobs follows next_offset when the cursor is null", async () => {
  const calls: string[] = [];
  const time = clock();
  const bodies = [
    page(["a"], { has_more: true, next_cursor: null, next_offset: 100 }),
    page(["b"], { has_more: false, next_cursor: null }),
  ];
  const fetchImpl: typeof fetch = (input) => {
    calls.push(String(input));
    return Promise.resolve(jsonResponse(bodies.shift()));
  };
  const pages: string[][] = [];
  for await (const batch of client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).listFeedJobs(FEED)) {
    pages.push(batch.map((item) => item.id));
  }

  expect(calls).toEqual([JOBS, `${JOBS}&offset=100`]);
  expect(pages).toEqual([["a"], ["b"]]);
});

test("listFeedJobs rejects a non-uuid feed id before any fetch", async () => {
  let fetched = 0;
  const time = clock();
  const fetchImpl: typeof fetch = () => {
    fetched += 1;
    return Promise.resolve(
      jsonResponse(page([], { has_more: false, next_cursor: null }))
    );
  };
  await expect(
    client({ fetch: fetchImpl, now: time.now, sleep: time.sleep })
      .listFeedJobs("not-a-uuid")
      .next()
  ).rejects.toMatchObject({ code: "invalid_response" });
  expect(fetched).toBe(0);
});

test("the limiter spaces request starts by 500ms", async () => {
  const time = clock();
  const fetchImpl: typeof fetch = () =>
    Promise.resolve(
      jsonResponse({
        data: [
          {
            category: "engineering",
            description: "Roles",
            filters: {},
            id: "engineering-it",
            name: "Engineering",
          },
        ],
        request_id: "req_templates",
      })
    );
  const api = client({ fetch: fetchImpl, now: time.now, sleep: time.sleep });
  await api.listTemplates();
  await api.listTemplates();
  await api.listTemplates();
  expect(time.sleeps).toEqual([500, 500]);
});

test("429 Retry-After 2 waits 2000ms and then accepts the retry", async () => {
  const time = clock();
  let fetches = 0;
  const fetchImpl: typeof fetch = () => {
    fetches += 1;
    if (fetches === 1) {
      return Promise.resolve(
        jsonResponse({ error: { code: "rate_limited" } }, 429, {
          "retry-after": "2",
        })
      );
    }

    return Promise.resolve(
      jsonResponse({
        data: [],
        request_id: "req_templates",
      })
    );
  };
  await client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).listTemplates();
  expect(fetches).toBe(2);
  expect(time.sleeps).toEqual([2000]);
});

test("429 three times throws rate_limited after three fetches", async () => {
  const time = clock();
  let fetches = 0;
  const fetchImpl: typeof fetch = () => {
    fetches += 1;
    return Promise.resolve(
      jsonResponse({ error: { code: "rate_limited" } }, 429, {
        "retry-after": "1",
      })
    );
  };
  await expect(
    client({
      fetch: fetchImpl,
      now: time.now,
      sleep: time.sleep,
    }).listTemplates()
  ).rejects.toMatchObject({ code: "rate_limited" });
  expect(fetches).toBe(3);
});

test("429 without a header uses error.retry_after", async () => {
  const time = clock();
  let fetches = 0;
  const fetchImpl: typeof fetch = () => {
    fetches += 1;
    if (fetches === 1) {
      return Promise.resolve(
        jsonResponse({ error: { code: "rate_limited", retry_after: 4 } }, 429)
      );
    }

    return Promise.resolve(
      jsonResponse({ data: [], request_id: "req_templates" })
    );
  };
  await client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).listTemplates();
  expect(time.sleeps).toEqual([4000]);
});

test("429 Retry-After above 10 seconds throws without sleeping", async () => {
  const time = clock();
  let fetches = 0;
  const fetchImpl: typeof fetch = () => {
    fetches += 1;
    return Promise.resolve(
      jsonResponse({ error: { code: "rate_limited" } }, 429, {
        "retry-after": "3600",
      })
    );
  };
  await expect(
    client({
      fetch: fetchImpl,
      now: time.now,
      sleep: time.sleep,
    }).listTemplates()
  ).rejects.toEqual(
    expect.objectContaining({
      code: "rate_limited",
      retryAfterSeconds: 3600,
    })
  );
  expect(fetches).toBe(1);
  expect(time.sleeps).toEqual([]);
  await expect(
    client({
      fetch: fetchImpl,
      now: time.now,
      sleep: time.sleep,
    }).listTemplates()
  ).rejects.toBeInstanceOf(BordfeedApiError);
});

test("preview retries a 400 once with no query string", async () => {
  const calls: string[] = [];
  const time = clock();
  const fetchImpl: typeof fetch = (input) => {
    calls.push(String(input));
    if (calls.length === 1) {
      return Promise.resolve(
        jsonResponse({ error: { code: "invalid_request" } }, 400)
      );
    }

    return Promise.resolve(
      jsonResponse({
        data: [{ id: "job-1", title: "Role" }],
        message: "Preview",
        preview: true,
        request_id: "req_preview",
        template: {
          description: "Roles",
          filters: {},
          id: "engineering-it",
          name: "Engineering",
        },
      })
    );
  };
  const preview = await client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).previewTemplate("engineering-it", previewQuerySchema.parse({ limit: 20 }));
  expect(calls).toEqual([
    "http://bf.test/api/v1/templates/engineering-it/preview?limit=20",
    "http://bf.test/api/v1/templates/engineering-it/preview",
  ]);
  expect(preview.data.map((item) => item.id)).toEqual(["job-1"]);
});
