// pg 8 treats sslmode=prefer, require and verify-ca as verify-full (full
// certificate and hostname checks) and warns about it on every new process,
// because pg 9 will switch them to the weaker libpq meanings. Neon's
// connection strings and the Vercel integration use sslmode=require, so
// spelling out verify-full keeps today's behavior, silences the warning, and
// stops the pg 9 upgrade from quietly weakening TLS.
//
// Left alone: any other sslmode (disable, no-verify, verify-full), a URL that
// opts into libpq semantics with uselibpqcompat, and a string that is not a
// URL.
const VERIFY_FULL_ALIASES = new Set(["prefer", "require", "verify-ca"]);

export function pgConnectionString(databaseUrl: string): string {
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }
  const sslmode = url.searchParams.get("sslmode");
  if (
    sslmode === null ||
    !VERIFY_FULL_ALIASES.has(sslmode) ||
    url.searchParams.has("uselibpqcompat")
  ) {
    return databaseUrl;
  }
  url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
