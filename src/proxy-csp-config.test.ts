import { NextRequest } from "next/server";
import { expect, test, vi } from "vitest";

vi.mock("@/config", async () => {
  const { defineBordfulConfig } = await import("@/config/define-config");
  return {
    bordfulConfig: defineBordfulConfig({
      csp: {
        extraConnectOrigins: ["https://api.example.com"],
        extraScriptOrigins: ["https://cdn.example.com"],
      },
    }),
  };
});

const { proxy } = await import("./proxy");

function directive(csp: string | null, name: string): string {
  return csp?.split("; ").find((part) => part.startsWith(`${name} `)) ?? "";
}

test("the proxy applies csp origins from bordful.config.ts", () => {
  const response = proxy(
    new NextRequest("http://localhost:3100/jobs", {
      headers: { host: "localhost:3100" },
    })
  );
  const csp = response.headers.get("Content-Security-Policy");

  expect(directive(csp, "script-src")).toContain("https://cdn.example.com");
  expect(directive(csp, "connect-src")).toContain("https://api.example.com");
  expect(directive(csp, "connect-src")).not.toContain(
    "https://cdn.example.com"
  );
});
