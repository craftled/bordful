import { beforeEach, expect, test, vi } from "vitest";

const unsubscribeByToken = vi.hoisted(() => vi.fn());

vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("payload", () => ({ getPayload: () => Promise.resolve({}) }));
vi.mock("@/lib/alerts/subscribe", () => ({ unsubscribeByToken }));

const { POST } = await import("./route");

function post(token: string): Promise<Response> {
  return POST(
    new Request(`http://x/alerts/unsubscribe/one-click?token=${token}`, {
      method: "POST",
    })
  );
}

beforeEach(() => {
  unsubscribeByToken.mockReset();
});

test("a known token unsubscribes", async () => {
  unsubscribeByToken.mockResolvedValue(true);
  const response = await post("known");
  expect(response.status).toBe(200);
  expect(await response.text()).toBe("unsubscribed");
});

test("an unknown token does not claim success", async () => {
  unsubscribeByToken.mockResolvedValue(false);
  const response = await post("unknown");
  expect(response.status).toBe(404);
  expect(await response.text()).toBe("unknown token");
});
