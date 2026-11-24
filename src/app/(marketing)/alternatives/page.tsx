import type { Metadata } from "next";
import { headers } from "next/headers";

import { AlternativesHub } from "@/components/marketing/alternatives/alternatives-hub";
import { ALTERNATIVES_HUB } from "@/components/marketing/alternatives/registry";
import { JsonLd } from "@/components/marketing/json-ld";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { assertMarketingEnabled } from "@/config/marketing-guard";
import { resolveServerUrl } from "@/config/server-url";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";
import { agentPageDescription } from "@/lib/docs/agent-pages";
import { alternativesHubJsonLd } from "@/lib/seo/structured-data";

export const metadata: Metadata = marketingPageMetadata({
  description: agentPageDescription("/alternatives"),
  markdownPath: markdownPathFor("/alternatives"),
  path: "/alternatives",
  title: ALTERNATIVES_HUB.metaTitle,
});

export default async function AlternativesPage() {
  assertMarketingEnabled();
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd data={alternativesHubJsonLd(resolveServerUrl())} nonce={nonce} />
      <AlternativesHub />
    </>
  );
}
