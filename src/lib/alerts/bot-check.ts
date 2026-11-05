import { checkBotId } from "botid/server";

interface BotVerdict {
  isBot: boolean;
}

export interface BotCheckDeps {
  check?: () => Promise<BotVerdict>;
  env?: { VERCEL?: string };
}

export async function isLikelyBot(deps: BotCheckDeps = {}): Promise<boolean> {
  const env = deps.env ?? process.env;
  if (env.VERCEL !== "1") {
    return false;
  }

  const check = deps.check ?? (() => checkBotId());
  try {
    const result = await check();
    return result.isBot;
  } catch {
    console.error("BotID check failed; treating the signup as a bot.");
    return true;
  }
}
