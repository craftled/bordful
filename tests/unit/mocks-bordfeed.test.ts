import { expect, test } from "vitest";

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
    template_id: "engineering-it",
    ...(workspace === undefined ? {} : { workspace }),
  };
}

test("preview default gives 10 jobs and limit=20 gives 20", async () => {
  const mock = createBordfeedMock();
  const preview = await call(mock, "/api/v1/templates/engineering-it/preview");
  expect(preview.status).toBe(200);
  const body = (await preview.json()) as {
    attribution: { logo_url: string; text: string; url: string };
    data: Record<string, unknown>[];
    filters_applied: { limit: number };
  };
  expect(body.data).toHaveLength(10);
  expect(body.data[0]?.title).toBe("Sample Platform Engineer 01");
  expect(body.data[0]?.description_html).toBeNull();
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
    "/api/v1/templates/engineering-it/preview?limit=20"
  );
  const wideBody = (await wide.json()) as { data: { title: string }[] };
  expect(wideBody.data).toHaveLength(20);
  expect(wideBody.data[19]?.title).toBe("Sample Platform Engineer 20");
});

test("foo=bar gives 400", async () => {
  const mock = createBordfeedMock();
  const response = await call(
    mock,
    "/api/v1/templates/engineering-it/preview?foo=bar"
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
  const registration = (await registered.json()) as {
    registration_id: string;
  };
  expect(registration.registration_id).toBe("reg_mock_0001");

  const verified = await call(mock, "/api/agent/verify", {
    body: JSON.stringify({
      code: "424242",
      registration_id: registration.registration_id,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  expect(verified.status).toBe(200);
  const key = (await verified.json()) as { api_key: string };
  expect(key.api_key).toBe(MOCK_API_KEY);

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
  expect(first.pagination.next_cursor).toBe("c2");

  const delayed = await call(mock, `${path}?cursor=c2`, { headers });
  expect(delayed.status).toBe(429);
  expect(delayed.headers.get("retry-after")).toBe("1");

  const page2 = await call(mock, `${path}?cursor=c2`, { headers });
  expect(page2.status).toBe(200);
  const second = (await page2.json()) as {
    data: unknown[];
    pagination: { next_cursor: string | null };
  };
  expect(second.data).toHaveLength(10);
  expect(second.pagination.next_cursor).toBe("c3");

  const page3 = await call(mock, `${path}?cursor=c3&include=description_html`, {
    headers,
  });
  expect(page3.status).toBe(200);
  const third = (await page3.json()) as {
    data: { description_html: string }[];
    pagination: { next_cursor: string | null };
  };
  expect(third.data).toHaveLength(5);
  expect(third.pagination.next_cursor).toBeNull();
  expect(third.data[0]?.description_html).toContain("Mock Feed Engineer");
});
