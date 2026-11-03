import { expect, test } from "vitest";
import { createBordfeedClient } from "./client";
import { BordfeedApiError } from "./errors";
import { previewQuerySchema } from "./preview-query";

const FEED = "11111111-1111-4111-8111-111111111111";
// biome-ignore lint/complexity/noUnnecessaryTemplateExpression: split literal keeps secret scanners from flagging the test key
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
    clientHeaders: { "X-Bordfeed-Client": "bordful/1.0.0" },
    fetch: options.fetch,
    now: options.now,
    sleep: options.sleep,
  });
}

test("fetchFeedPage makes one request with the pinned query order", async () => {
  const calls: Call[] = [];
  const time = clock();
  const fetchImpl: typeof fetch = (input, init) => {
    calls.push({ headers: lowerHeaders(init?.headers), url: String(input) });
    return Promise.resolve(
      jsonResponse(page(["a"], { has_more: true, next_cursor: "c2" }))
    );
  };
  const result = await client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).fetchFeedPage(FEED, { limit: 50 });

  expect(calls.map((call) => call.url)).toEqual([
    `http://bf.test/api/v1/feeds/${FEED}/jobs?limit=50&include=description_html`,
  ]);
  expect(result.data.map((item) => item.id)).toEqual(["a"]);
  expect(result).toMatchObject({
    hasMore: true,
    nextCursor: "c2",
    nextOffset: null,
  });
  expect(calls[0]?.headers.authorization).toBe(`Bearer ${KEY}`);
  expect(calls[0]?.headers["x-bordfeed-client"]).toBe("bordful/1.0.0");
});

test("fetchFeedPage sends delta params and clamps the limit to 100", async () => {
  const calls: string[] = [];
  const time = clock();
  const fetchImpl: typeof fetch = (input) => {
    calls.push(String(input));
    return Promise.resolve(
      jsonResponse(
        page(["b"], { has_more: true, next_cursor: null, next_offset: 40 })
      )
    );
  };
  const api = client({ fetch: fetchImpl, now: time.now, sleep: time.sleep });
  const result = await api.fetchFeedPage(FEED, {
    cursor: "c9",
    limit: 500,
    since: "2026-11-02T23:00:00.000Z",
    sinceField: "updated",
  });
  await api.fetchFeedPage(FEED, {
    limit: 20,
    offset: 40,
    since: "2026-11-02T23:00:00.000Z",
    status: "closed",
  });

  expect(calls).toEqual([
    `${JOBS}&since=2026-11-02T23%3A00%3A00.000Z&since_field=updated&cursor=c9`,
    `http://bf.test/api/v1/feeds/${FEED}/jobs?limit=20&include=description_html&since=2026-11-02T23%3A00%3A00.000Z&since_field=updated&status=closed&offset=40`,
  ]);
  expect(result).toMatchObject({ nextCursor: null, nextOffset: 40 });
});

test("fetchFeedPage rejects has_more without a cursor or offset", async () => {
  const time = clock();
  const fetchImpl: typeof fetch = () =>
    Promise.resolve(
      jsonResponse(page(["a"], { has_more: true, next_cursor: null }))
    );
  await expect(
    client({
      fetch: fetchImpl,
      now: time.now,
      sleep: time.sleep,
    }).fetchFeedPage(FEED, { limit: 50 })
  ).rejects.toMatchObject({ code: "invalid_response" });
});

test("fetchFeedPage rejects a non-uuid feed id before any fetch", async () => {
  let fetched = 0;
  const time = clock();
  const fetchImpl: typeof fetch = () => {
    fetched += 1;
    return Promise.resolve(
      jsonResponse(page([], { has_more: false, next_cursor: null }))
    );
  };
  await expect(
    client({
      fetch: fetchImpl,
      now: time.now,
      sleep: time.sleep,
    }).fetchFeedPage("not-a-uuid", { limit: 50 })
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
            category: "general",
            description: "Roles",
            filters: {},
            id: "fully-remote",
            name: "Fully Remote",
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
          id: "fully-remote",
          name: "Engineering",
        },
      })
    );
  };
  const preview = await client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).previewTemplate("fully-remote", previewQuerySchema.parse({ limit: 20 }));
  expect(calls).toEqual([
    "http://bf.test/api/v1/templates/fully-remote/preview?limit=20",
    "http://bf.test/api/v1/templates/fully-remote/preview",
  ]);
  expect(preview.data.map((item) => item.id)).toEqual(["job-1"]);
});

test("a thrown fetch becomes a network error that omits the key", async () => {
  const time = clock();
  const fetchImpl: typeof fetch = () => {
    throw new TypeError(`fetch failed for Bearer ${KEY}`);
  };
  const api = client({ fetch: fetchImpl, now: time.now, sleep: time.sleep });

  await expect(api.listTemplates()).rejects.toSatisfy((error: unknown) => {
    expect(error).toBeInstanceOf(BordfeedApiError);
    if (!(error instanceof BordfeedApiError)) {
      return false;
    }

    expect(error.code).toBe("network");
    expect(error.message).toBe("Could not reach Bordfeed.");
    expect(JSON.stringify({ ...error, message: error.message })).not.toContain(
      KEY
    );
    return true;
  });
});

test("503 waits 1000ms and then accepts the retry", async () => {
  const time = clock();
  let fetches = 0;
  const fetchImpl: typeof fetch = () => {
    fetches += 1;
    if (fetches === 1) {
      return Promise.resolve(
        jsonResponse({ error: { code: "server_error" } }, 503)
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
  expect(fetches).toBe(2);
  expect(time.sleeps).toEqual([1000]);
});

test("checkJob reads a free lookup, a billed one and Bordfeed's not_found", async () => {
  const time = clock();
  const urls: string[] = [];
  const answers = [
    jsonResponse({ data: job("a"), jobs_charged: 0, request_id: "r1" }),
    jsonResponse({ data: job("b"), jobs_charged: 1, request_id: "r2" }),
    jsonResponse(
      { error: { code: "not_found", message: "Job not found" } },
      404
    ),
  ];
  const fetchImpl: typeof fetch = (input) => {
    urls.push(String(input));
    const answer = answers.shift();
    return answer
      ? Promise.resolve(answer)
      : Promise.reject(new Error("extra"));
  };
  const api = client({ fetch: fetchImpl, now: time.now, sleep: time.sleep });

  await expect(api.checkJob("a")).resolves.toEqual({
    charged: 0,
    status: "active",
  });
  await expect(api.checkJob("b")).resolves.toEqual({
    charged: 1,
    status: "active",
  });
  await expect(api.checkJob("c/d")).resolves.toEqual({ status: "gone" });
  expect(urls).toEqual([
    "http://bf.test/api/v1/jobs/a",
    "http://bf.test/api/v1/jobs/b",
    "http://bf.test/api/v1/jobs/c%2Fd",
  ]);
});

test("checkJob never reads a 404 without Bordfeed's not_found as gone", async () => {
  const time = clock();
  const fetchImpl: typeof fetch = () =>
    Promise.resolve(new Response("Not Found", { status: 404 }));
  const error = await client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  })
    .checkJob("a")
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(BordfeedApiError);
  expect(error).toMatchObject({ code: "invalid_response", status: 404 });
});

test("a dropped connection on a read is retried once", async () => {
  const time = clock();
  let fetches = 0;
  const fetchImpl: typeof fetch = () => {
    fetches += 1;
    if (fetches === 1) {
      return Promise.reject(new TypeError("fetch failed"));
    }
    return Promise.resolve(jsonResponse({ data: job("a"), jobs_charged: 0 }));
  };
  const result = await client({
    fetch: fetchImpl,
    now: time.now,
    sleep: time.sleep,
  }).checkJob("a");
  expect(result).toEqual({ charged: 0, status: "active" });
  expect(fetches).toBe(2);
  expect(time.sleeps).toContain(1000);
});
