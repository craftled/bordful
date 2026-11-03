export function GET(request: Request) {
  return Response.redirect(new URL("/feed.xml", request.url), 301);
}
