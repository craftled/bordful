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

Bun.serve({
  fetch(request) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/__mock/health") {
      return new Response("ok", { status: 200 });
    }

    return new Response("not found", { status: 404 });
  },
  hostname: "127.0.0.1",
  port,
});
