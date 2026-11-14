// Booting Payload migrates and seeds whatever DATABASE_URL points at, and the
// Payload CLI fills a missing value from .env files in parent folders, even the
// home folder. Commands that change data confirm the host before they boot.

export type DatabaseTarget =
  | { host: string; ok: true }
  | { host: string | null; message: string; ok: false };

function hostOf(databaseUrl: string): string | null {
  try {
    const host = new URL(databaseUrl).hostname;
    return host.length > 0 ? host.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function checkDatabaseTarget(
  databaseUrl: string | undefined,
  confirmedHost: string | undefined
): DatabaseTarget {
  if (!databaseUrl?.trim()) {
    return {
      host: null,
      message:
        "DATABASE_URL is empty. Set it to your board's database. If you pulled it with `vercel env pull`, a Sensitive value comes back empty: copy it from your Neon dashboard instead.",
      ok: false,
    };
  }

  const host = hostOf(databaseUrl.trim());
  if (!host) {
    return {
      host: null,
      message: "DATABASE_URL is not a valid connection URL.",
      ok: false,
    };
  }

  if (!confirmedHost) {
    return {
      host,
      message: `This changes the database at ${host}. If that is your board's database, run the command again with --database-host ${host}`,
      ok: false,
    };
  }

  if (confirmedHost.trim().toLowerCase() !== host) {
    return {
      host,
      message: `DATABASE_URL points at ${host}, not ${confirmedHost}. Nothing was changed.`,
      ok: false,
    };
  }

  return { host, ok: true };
}
