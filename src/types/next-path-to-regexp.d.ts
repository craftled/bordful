// Next bundles path-to-regexp 6 at this path and matches next.config header
// and redirect sources with it. It ships no types, so this declares the one
// function proxy.test.ts uses. Importing Next's own copy keeps the test on
// exactly the matcher Next runs, whatever version npm calls latest.
declare module "next/dist/compiled/path-to-regexp" {
  export function match(
    path: string
  ): (pathname: string) => false | { params: Record<string, unknown> };
}
