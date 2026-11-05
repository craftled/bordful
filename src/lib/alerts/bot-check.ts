import { checkBotId } from "botid/server";

interface BotVerdict {
  isBot: boolean;
}

export interface BotCheckDeps {
  check?: () => Promise<BotVerdict>;
  env?: { NEXT_PUBLIC_VERCEL_ENV?: string };
}

export async function isLikelyBot(deps: BotCheckDeps = {}): Promise<boolean> {
  // Same signal as src/instrumentation-client.ts, which only attaches BotID
  // headers on Vercel. checkBotId also throws off Vercel (no OIDC token).
  const env = deps.env ?? process.env;
  if (!env.NEXT_PUBLIC_VERCEL_ENV) {
    return false;
  }

  const check = deps.check ?? (() => checkBotId());
  try {
    const result = await check();
    return result.isBot;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown error";
    console.error(
      `BotID check failed; treating the signup as a bot: ${reason}`
    );
    return true;
  }
}
