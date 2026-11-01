import type { NavItem } from "@/config/nav";

// "/" matches only itself. Other paths also match their child routes, so
// /jobs/type/full-time keeps the Jobs link active.
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

// matchPrefixes lets an item stay active on routes outside its href, such
// as the board-only Jobs item (href "/") on /jobs pages.
export function isActiveItem(pathname: string, item: NavItem): boolean {
  return [item.href, ...(item.matchPrefixes ?? [])].some((href) =>
    isActivePath(pathname, href)
  );
}
