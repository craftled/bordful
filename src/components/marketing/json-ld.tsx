import { jsonLdHtml } from "@/lib/seo/structured-data";

export function JsonLd({ data, nonce }: { data: unknown; nonce?: string }) {
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is data and "<" is escaped
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(data) }}
      nonce={nonce}
      type="application/ld+json"
    />
  );
}
