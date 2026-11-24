import Link from "next/link";
import type { ComponentProps } from "react";
import { BOARD_SEARCH_PATH } from "@/lib/board/paths";

type LinkProps = ComponentProps<typeof Link>;

const QUERY_OR_HASH = /[?#]/u;

function hrefPath(href: LinkProps["href"]): string {
  if (typeof href === "string") {
    return href.split(QUERY_OR_HASH)[0] ?? href;
  }
  return href.pathname ?? "";
}

// True for /jobs/search with or without a query string.
export function isSearchHref(href: LinkProps["href"]): boolean {
  return hrefPath(href) === BOARD_SEARCH_PATH;
}

// next/link with prefetch off for /jobs/search. Search runs a database query
// per request, and a firewall rule can put it behind a bot challenge that a
// background prefetch cannot pass (the request fails with a 429 in the
// console). The click still navigates normally. Every other href keeps
// Next's default prefetching, and an explicit prefetch prop wins.
export function BoardLink({ prefetch, ...props }: LinkProps) {
  return (
    <Link
      prefetch={prefetch ?? (isSearchHref(props.href) ? false : undefined)}
      {...props}
    />
  );
}
