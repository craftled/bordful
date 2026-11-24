import type { Metadata } from "next";

import { isMarketingEnabled } from "@/config/flags";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";

// The `<link rel="alternate" type="text/markdown">` entry for a board page.
// Markdown versions are served only when marketing is on, so a fork gets no
// link to a .md URL that would 404. Call it per request (generateMetadata),
// not in a static metadata object, so it reads the runtime env.
export function boardMarkdownAlternate(
  path: string,
  env: Partial<NodeJS.ProcessEnv> = process.env
): NonNullable<NonNullable<Metadata["alternates"]>["types"]> | undefined {
  return isMarketingEnabled(env)
    ? { "text/markdown": markdownPathFor(path) }
    : undefined;
}
