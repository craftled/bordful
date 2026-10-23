import { createBordfeedMock } from "./bordfeed";
import { createGithubMock, type GithubRelease } from "./github";
import { createResendMock } from "./resend";

// bun-types is not installed. This process runs under bun.
declare const Bun: {
  serve: (options: {
    fetch: (request: Request) => Response | Promise<Response>;
    hostname?: string;
    port: number;
  }) => unknown;
};

const port = Number(process.env.MOCK_PORT ?? "4999");
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  process.stderr.write("MOCK_PORT must be an integer port\n");
  process.exit(1);
}

const bordfeed = createBordfeedMock();
const resend = createResendMock();
const github = createGithubMock();

function resetAll(): void {
  bordfeed.reset();
  resend.reset();
  github.reset();
}

async function route(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === "GET" && pathname === "/__mock/health") {
    return new Response("ok", { status: 200 });
  }

  if (request.method === "POST" && pathname === "/__mock/reset") {
    resetAll();
    return Response.json({ ok: true });
  }

  if (request.method === "GET" && pathname === "/__mock/bordfeed/requests") {
    return Response.json(bordfeed.state.requests);
  }

  if (request.method === "GET" && pathname === "/__mock/resend/emails") {
    return Response.json(resend.state.emails);
  }

  if (request.method === "POST" && pathname === "/__mock/github/releases") {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: { code: "validation_error", message: "Expected a list" } },
        { status: 422 }
      );
    }
    if (!Array.isArray(body)) {
      return Response.json(
        { error: { code: "validation_error", message: "Expected a list" } },
        { status: 422 }
      );
    }
    github.state.releases = body as GithubRelease[];
    return Response.json(github.state.releases);
  }

  if (pathname.startsWith("/api/v1/") || pathname.startsWith("/api/agent/")) {
    return bordfeed.handle(request);
  }

  if (pathname === "/emails") {
    return resend.handle(request);
  }

  if (pathname.startsWith("/repos/")) {
    return github.handle(request);
  }

  return new Response("not found", { status: 404 });
}

function isDirectRun(): boolean {
  const entry = process.argv[1] ?? "";
  return entry.endsWith("/server.ts") || entry.endsWith("/server.js");
}

if (isDirectRun()) {
  Bun.serve({
    fetch: route,
    hostname: "127.0.0.1",
    port,
  });
}
