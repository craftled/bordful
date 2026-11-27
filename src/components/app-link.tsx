import Link from "next/link";
import type { ComponentProps } from "react";

type LinkProps = ComponentProps<typeof Link>;

// next/link with prefetch off unless a link asks for it. Every page is
// rendered per request (the nonce CSP), and with no loading.js boundary
// Next's default prefetch of a dynamic route returns only the route tree:
// a few hundred bytes that cannot speed up the click, for one server
// invocation per link in the viewport. /jobs alone had about 40 of them per
// view. /jobs/search is also behind a firewall challenge a background request
// cannot pass. Clicks navigate normally, and an explicit prefetch prop wins.
export function AppLink({ prefetch = false, ...props }: LinkProps) {
  return <Link prefetch={prefetch} {...props} />;
}
