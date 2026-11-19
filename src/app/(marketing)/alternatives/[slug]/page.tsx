import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AlternativeView } from "@/components/marketing/alternatives/alternative-page";
import {
  ALTERNATIVE_SLUGS,
  getAlternative,
} from "@/components/marketing/alternatives/registry";
import { JsonLd } from "@/components/marketing/json-ld";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { assertMarketingEnabled } from "@/config/marketing-guard";
import { resolveServerUrl } from "@/config/server-url";
import { alternativePageJsonLd } from "@/lib/seo/structured-data";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALTERNATIVE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getAlternative(slug);
  if (!page) {
    return {};
  }

  return marketingPageMetadata({
    description: page.metaDescription,
    path: `/alternatives/${slug}`,
    title: page.metaTitle,
  });
}

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  assertMarketingEnabled();
  const { slug } = await params;
  const page = getAlternative(slug);
  if (!page) {
    notFound();
  }
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <JsonLd
        data={alternativePageJsonLd(resolveServerUrl(), page)}
        nonce={nonce}
      />
      <AlternativeView page={page} />
    </>
  );
}
