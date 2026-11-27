// Booting Payload seeds whatever DATABASE_URL points at (onInit), and migrates
// it when NODE_ENV is production. The Payload CLI loads the first .env file it
// finds in a parent folder when the current folder has none. Commands that
// change data confirm the target before they boot.
// pg is the driver Payload's Postgres adapter connects with, so this parses the URL exactly as it will.
import { Client } from "pg";

export type DatabaseTarget =
  | { ok: true; target: string }
  | { message: string; ok: false; target: string | null };

function urlHostname(databaseUrl: string): string | null {
  try {
    const host = new URL(databaseUrl).hostname
      .toLowerCase()
      .replace(/^\[|\]$/gu, "");
    return host.length > 0 ? host : null;
  } catch {
    return null;
  }
}

// Asks pg itself, so the target is what a connection would really use,
// including ?host=, ?port= and the PG* environment fallbacks.
function resolveTarget(
  databaseUrl: string
): { host: string; rest: string } | "socket" | "mismatch" | null {
  const urlHost = urlHostname(databaseUrl);
  if (!urlHost) {
    return null;
  }

  // sslmode does not change the target, and pg warns about it on every parse.
  const withoutSsl = new URL(databaseUrl);
  withoutSsl.searchParams.delete("sslmode");
  const client = new Client({ connectionString: withoutSsl.toString() });
  const host = String(client.host).toLowerCase();
  if (host.length === 0 || host.startsWith("/") || host.includes(",")) {
    return "socket";
  }
  if (host !== urlHost) {
    return "mismatch";
  }

  return { host, rest: `:${client.port}/${client.database ?? ""}` };
}

export function checkDatabaseTarget(
  databaseUrl: string | undefined,
  confirmedTarget: string | undefined
): DatabaseTarget {
  if (!databaseUrl?.trim()) {
    return {
      message:
        "DATABASE_URL is empty. Set it to your board's database. If you pulled it with `vercel env pull`, a Sensitive value comes back empty: copy it from your Neon dashboard instead.",
      ok: false,
      target: null,
    };
  }

  const resolved = resolveTarget(databaseUrl.trim());
  if (resolved === null) {
    return {
      message: "DATABASE_URL is not a valid connection URL.",
      ok: false,
      target: null,
    };
  }
  if (resolved === "socket" || resolved === "mismatch") {
    return {
      message:
        "DATABASE_URL connects somewhere other than its URL host, through a socket path, a host list or a host query parameter. Use a plain postgresql://user:password@host/database URL. Nothing was changed.",
      ok: false,
      target: null,
    };
  }

  const target = `${resolved.host}${resolved.rest}`;
  if (!confirmedTarget?.trim()) {
    return {
      message: `This changes the database at ${target}. If that is your board's database, run the command again with --database-host ${target}`,
      ok: false,
      target,
    };
  }

  const confirmed = confirmedTarget.trim();
  const matches =
    confirmed.slice(0, resolved.host.length).toLowerCase() === resolved.host &&
    confirmed.slice(resolved.host.length) === resolved.rest;
  if (!matches) {
    return {
      message: `DATABASE_URL points at ${target}, not ${confirmed}. Nothing was changed.`,
      ok: false,
      target,
    };
  }

  return { ok: true, target };
}
