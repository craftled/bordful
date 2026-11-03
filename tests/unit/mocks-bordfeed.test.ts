import { expect, test } from "vitest";
import { createBordfeedClient } from "../../src/lib/bordfeed/client";
import { BordfeedApiError } from "../../src/lib/bordfeed/errors";
import {
  createBordfeedMock,
  MOCK_API_KEY,
  MOCK_FEED_ID,
} from "../mocks/bordfeed";
import { JOB_PROPERTIES } from "../mocks/job-shape";

const ORIGIN = "http://127.0.0.1";

function call(
  mock: ReturnType<typeof createBordfeedMock>,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return mock.handle(new Request(`${ORIGIN}${path}`, init));
}

function registerBody(email: string, workspace?: string) {
  return {
    agent_name: "bordful",
    board_name: "Example Board",
    email,
    template_id: "fully-remote",
    ...(workspace === undefined ? {} : { workspace }),
  };
}

test("preview default gives 10 jobs and limit=20 gives 20", async () => {
  const mock = createBordfeedMock();
  const preview = await call(mock, "/api/v1/templates/fully-remote/preview");
  expect(preview.status).toBe(200);
  const body = (await preview.json()) as {
    attribution: { logo_url: string; text: string; url: string };
    data: Record<string, unknown>[];
    filters_applied: { limit: number };
  };
  expect(body.data).toHaveLength(10);
  expect(body.data[0]?.title).toBe("Sample Platform Engineer 01");
  expect(body.data[0]?.description_html).toBeNull();
  expect(body.data[0]?.enrichment).toEqual({
    enriched_at: null,
    fields_from_source: [],
    model: null,
    monitor_checked_at: null,
    monitor_status: null,
    revision: null,
    salary_normalized_at: null,
  });
  expect(Object.keys(body.data[0] ?? {}).sort()).toEqual(
    [...JOB_PROPERTIES].sort()
  );
  expect(body.attribution).toEqual({
    logo_url: "https://bordfeed.com/logo.png",
    text: "Jobs by Bordfeed",
    url: "https://bordfeed.com/?ref=bordful",
  });
  expect(body.filters_applied.limit).toBe(10);

  const wide = await call(
    mock,
    "/api/v1/templates/fully-remote/preview?limit=20"
  );
  const wideBody = (await wide.json()) as { data: { title: string }[] };
  expect(wideBody.data).toHaveLength(20);
  expect(wideBody.data[19]?.title).toBe("Sample Platform Engineer 20");
});

test("foo=bar gives 400", async () => {
  const mock = createBordfeedMock();
  const response = await call(
    mock,
    "/api/v1/templates/fully-remote/preview?foo=bar"
  );
  expect(response.status).toBe(400);
  const body = (await response.json()) as { error: { code: string } };
  expect(body.error.code).toBe("invalid_request");
});

test("register then verify 424242 issues the key once", async () => {
  const mock = createBordfeedMock();
  const registered = await call(mock, "/api/agent/register", {
    body: JSON.stringify(registerBody("owner@example.com")),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(registered.status).toBe(200);
  const registration = (await registered.json()) as Record<string, unknown> & {
    registration_id: string;
  };
  // auth.md register shape: no expires_at, expiry in seconds.
  expect(Object.keys(registration).sort()).toEqual(
    ["email", "expires_in", "next", "registration_id"].sort()
  );
  expect(registration.registration_id).toBe(
    "00000000-0000-4000-8000-000000000001"
  );
  expect(registration.expires_in).toBe(600);
  expect(registration.email).toBe("owner@example.com");

  const verified = await call(mock, "/api/agent/verify", {
    body: JSON.stringify({
      code: "424242",
      registration_id: registration.registration_id,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(verified.status).toBe(200);
  const key = (await verified.json()) as {
    account: string;
    api_key: string;
    suggested_feed: unknown;
  };
  expect(key.api_key).toBe(MOCK_API_KEY);
  expect(key.account).toBe("created");
  expect(key.suggested_feed).toEqual({
    body: { filters: {}, name: "Fully Remote", template_id: "fully-remote" },
    create: "POST https://bordfeed.com/api/v1/feeds",
    dashboard_url:
      "https://bordfeed.com/dashboard/organization/feeds/create?template=fully-remote",
    template_id: "fully-remote",
  });

  const again = await call(mock, "/api/agent/verify", {
    body: JSON.stringify({
      code: "424242",
      registration_id: registration.registration_id,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(again.status).toBe(409);
  const error = (await again.json()) as { error: { code: string } };
  expect(error.error.code).toBe("already_issued");
});

test("limited@example.com gives 429 with retry-after 3600", async () => {
  const mock = createBordfeedMock();
  const response = await call(mock, "/api/agent/register", {
    body: JSON.stringify(registerBody("limited@example.com")),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("3600");
  const body = (await response.json()) as {
    error: { retry_after: number };
  };
  expect(body.error.retry_after).toBe(3600);
});

test("feed pages are 10, 10 and 5 with one 429 before page 2", async () => {
  const mock = createBordfeedMock();
  const headers = { authorization: `Bearer ${MOCK_API_KEY}` };
  const path = `/api/v1/feeds/${MOCK_FEED_ID}/jobs`;

  const page1 = await call(mock, path, { headers });
  expect(page1.status).toBe(200);
  const first = (await page1.json()) as {
    data: { description_html: string | null; title: string }[];
    pagination: { next_cursor: string | null };
  };
  expect(first.data).toHaveLength(10);
  expect(first.data[0]?.title).toBe("Mock Feed Engineer 01");
  expect(first.data[0]?.description_html).toBeNull();
  expect(first.pagination.next_cursor).toBe("c10");

  const delayed = await call(mock, `${path}?cursor=c10`, { headers });
  expect(delayed.status).toBe(429);
  expect(delayed.headers.get("retry-after")).toBe("1");

  const page2 = await call(mock, `${path}?cursor=c10`, { headers });
  expect(page2.status).toBe(200);
  const second = (await page2.json()) as {
    data: unknown[];
    pagination: { next_cursor: string | null };
  };
  expect(second.data).toHaveLength(10);
  expect(second.pagination.next_cursor).toBe("c20");

  const page3 = await call(
    mock,
    `${path}?cursor=c20&include=description_html`,
    {
      headers,
    }
  );
  expect(page3.status).toBe(200);
  const third = (await page3.json()) as {
    data: { description_html: string }[];
    pagination: { next_cursor: string | null };
  };
  expect(third.data).toHaveLength(5);
  expect(third.pagination.next_cursor).toBeNull();
  expect(third.data[0]?.description_html).toContain("Mock Feed Engineer");
});

test("feed reads bill new jobs once and honor limit, since and status", async () => {
  let clock = Date.parse("2026-11-03T00:00:00.000Z");
  const mock = createBordfeedMock({ feedTotal: 300, now: () => clock });
  const headers = { authorization: `Bearer ${MOCK_API_KEY}` };
  const path = `/api/v1/feeds/${MOCK_FEED_ID}/jobs`;
  expect(mock.balance()).toBe(2000);

  const big = await call(mock, `${path}?limit=50`, { headers });
  const bigBody = (await big.json()) as {
    data: unknown[];
    pagination: { has_more: boolean };
  };
  expect(bigBody.data).toHaveLength(50);
  expect(bigBody.pagination.has_more).toBe(true);
  expect(mock.balance()).toBe(1950);

  const tooBig = await call(mock, `${path}?limit=101`, { headers });
  expect(tooBig.status).toBe(400);

  const since = new Date(clock).toISOString();
  clock += 60_000;
  mock.touchFeedJobs([3, 4]);
  mock.closeFeedJobs([7]);
  const delta = await call(
    mock,
    `${path}?limit=50&since=${encodeURIComponent(since)}&since_field=updated`,
    { headers }
  );
  const deltaBody = (await delta.json()) as { data: { title: string }[] };
  expect(deltaBody.data.map((job) => job.title)).toEqual([
    "Mock Feed Engineer 03",
    "Mock Feed Engineer 04",
  ]);

  const closed = await call(
    mock,
    `${path}?limit=50&since=${encodeURIComponent(since)}&since_field=updated&status=closed`,
    { headers }
  );
  const closedBody = (await closed.json()) as { data: { title: string }[] };
  expect(closedBody.data.map((job) => job.title)).toEqual([
    "Mock Feed Engineer 07",
  ]);
  // Jobs 3, 4 and 7 came in the first page, so sending them again is free.
  expect(mock.state.servedJobs).toBe(53);
  expect(mock.state.billedJobs).toBe(50);
  expect(mock.balance()).toBe(1950);

  const next = await call(mock, `${path}?limit=10&cursor=c50`, { headers });
  expect(next.status).toBe(429);
  const fresh = await call(mock, `${path}?limit=10&cursor=c50`, { headers });
  expect(((await fresh.json()) as { data: unknown[] }).data).toHaveLength(10);
  expect(mock.balance()).toBe(1940);
});

function createFeed(
  mock: ReturnType<typeof createBordfeedMock>,
  body: Record<string, unknown>
): Promise<Response> {
  return call(mock, "/api/v1/feeds", {
    body: JSON.stringify(body),
    headers: {
      authorization: `Bearer ${MOCK_API_KEY}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
}

test("feed create without filters is a 422 like live", async () => {
  const mock = createBordfeedMock();
  const missing = await createFeed(mock, {
    name: "Job Board",
    template_id: "fully-remote",
  });
  expect(missing.status).toBe(422);
  const error = (await missing.json()) as {
    error: { code: string; errors: { path: string[] }[] };
  };
  expect(error.error.code).toBe("validation_error");
  expect(error.error.errors[0]?.path).toEqual(["filters"]);

  const created = await createFeed(mock, {
    filters: {},
    name: "Fully Remote",
    template_id: "fully-remote",
  });
  expect(created.status).toBe(201);
});

test("credits start at 0 and the first feed read grants 2000", async () => {
  const mock = createBordfeedMock();
  const headers = { authorization: `Bearer ${MOCK_API_KEY}` };
  const page = await call(mock, `/api/v1/feeds/${MOCK_FEED_ID}/jobs`, {
    headers,
  });
  expect(page.status).toBe(200);
  const balance = await call(mock, "/api/v1/billing/balance", { headers });
  const body = (await balance.json()) as { data: { balance_jobs: number } };
  expect(body.data.balance_jobs).toBe(1990);
});

test("nocredits@example.com makes billed feed reads a 402", async () => {
  const mock = createBordfeedMock();
  await call(mock, "/api/agent/register", {
    body: JSON.stringify(registerBody("nocredits@example.com")),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const page = await call(mock, `/api/v1/feeds/${MOCK_FEED_ID}/jobs`, {
    headers: { authorization: `Bearer ${MOCK_API_KEY}` },
  });
  expect(page.status).toBe(402);
  const body = (await page.json()) as { error: { code: string } };
  expect(body.error.code).toBe("insufficient_credits");
});

function mockClient(mock: ReturnType<typeof createBordfeedMock>) {
  return createBordfeedClient({
    baseUrl: ORIGIN,
    clientHeaders: {},
    fetch: (input, init) => mock.handle(new Request(String(input), init)),
    now: () => 0,
    sleep: () => Promise.resolve(),
  });
}

test("the client keeps invalid_registration on a 404 from verify", async () => {
  const mock = createBordfeedMock();
  const error = await mockClient(mock)
    .verify({
      code: "123456",
      registration_id: "00000000-0000-4000-8000-000000000999",
    })
    .catch((caught: unknown) => caught);
  expect(error).toBeInstanceOf(BordfeedApiError);
  expect((error as BordfeedApiError).status).toBe(404);
  expect((error as BordfeedApiError).code).toBe("invalid_registration");
});

test("a domain-like board_name is a 400 and a missing one names the org from the email", async () => {
  const mock = createBordfeedMock();
  const rejected = await call(mock, "/api/agent/register", {
    body: JSON.stringify({
      ...registerBody("owner@example.com"),
      board_name: "Remote.io",
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(rejected.status).toBe(400);

  const { board_name: _unused, ...withoutBoard } = registerBody(
    "ada+bot@example.com"
  );
  const registered = await call(mock, "/api/agent/register", {
    body: JSON.stringify(withoutBoard),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const { registration_id } = (await registered.json()) as {
    registration_id: string;
  };
  const verified = await call(mock, "/api/agent/verify", {
    body: JSON.stringify({ code: "424242", registration_id }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const body = (await verified.json()) as { organization: { name: string } };
  expect(body.organization.name).toBe("ada");
});

test("an unknown template_id on feed create is a 404 not_found", async () => {
  const mock = createBordfeedMock();
  const response = await call(mock, "/api/v1/feeds", {
    body: JSON.stringify({ filters: {}, name: "Board", template_id: "nope" }),
    headers: {
      authorization: `Bearer ${MOCK_API_KEY}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  expect(response.status).toBe(404);
  const body = (await response.json()) as { error: { code: string } };
  expect(body.error.code).toBe("not_found");
});
