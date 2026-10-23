import type { BordfeedRequestLog } from "../../mocks/bordfeed";
import type { GithubRelease } from "../../mocks/github";
import type { StoredEmail } from "../../mocks/resend";

export function mockOrigin(): string {
  const port = process.env.MOCK_PORT ?? "4999";
  return `http://127.0.0.1:${port}`;
}

export function mockUrl(path: string): string {
  return new URL(path, mockOrigin()).href;
}

async function readJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(mockUrl(path), init);
  if (!response.ok) {
    throw new Error(`mock ${path} returned ${response.status}`);
  }
  return (await response.json()) as T;
}

export function resetMock(): Promise<{ ok: boolean }> {
  return readJson("/__mock/reset", { method: "POST" });
}

export function bordfeedRequests(): Promise<BordfeedRequestLog[]> {
  return readJson("/__mock/bordfeed/requests");
}

export function resendEmails(): Promise<StoredEmail[]> {
  return readJson("/__mock/resend/emails");
}

export function setReleases(list: GithubRelease[]): Promise<GithubRelease[]> {
  return readJson("/__mock/github/releases", {
    body: JSON.stringify(list),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}
