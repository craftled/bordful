// "/" matches only itself. Other paths also match their child routes, so
// /jobs/type/full-time keeps the Jobs link active.
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
