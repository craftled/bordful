import {
  type APIRequestContext,
  type APIResponse,
  expect,
  type Page,
  request as playwrightRequest,
} from "@playwright/test";

export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "Example-Passw0rd-123";
const ADMIN_HOME = /\/admin\/?$/;

function appBaseUrl(): string {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    return process.env.PLAYWRIGHT_BASE_URL;
  }

  const port = process.env.APP_PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}

async function tokenFrom(response: APIResponse): Promise<string | null> {
  if (!response.ok()) {
    return null;
  }

  const body = (await response.json()) as { token?: unknown };
  return typeof body.token === "string" ? body.token : null;
}

async function adminToken(request: APIRequestContext): Promise<string> {
  const registered = await request.post("/api/users/first-register", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const created = await tokenFrom(registered);
  if (created !== null) {
    return created;
  }

  const login = await request.post("/api/users/login", {
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  const token = await tokenFrom(login);
  if (token === null) {
    throw new Error(`admin login failed with status ${login.status()}`);
  }

  return token;
}

export async function ensureAdmin(
  request: APIRequestContext
): Promise<APIRequestContext> {
  const token = await adminToken(request);
  return playwrightRequest.newContext({
    baseURL: appBaseUrl(),
    extraHTTPHeaders: { authorization: `JWT ${token}` },
  });
}

export async function loginInBrowser(page: Page): Promise<void> {
  const api = await ensureAdmin(page.request);
  await api.dispose();
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.locator("input[name='password']").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(ADMIN_HOME);
}
