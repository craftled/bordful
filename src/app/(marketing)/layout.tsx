import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import { marketingLayoutMetadata } from "@/components/marketing/metadata";
import { isMarketingEnabled } from "@/config/flags";

import "../globals.css";

export async function generateMetadata(): Promise<Metadata> {
  await headers();

  return marketingLayoutMetadata(isMarketingEnabled());
}

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  await headers();

  if (!isMarketingEnabled()) {
    return (
      <html lang="en">
        <body>{children}</body>
      </html>
    );
  }

  const { MarketingFrame } = await import("./_components/marketing-frame");

  return <MarketingFrame>{children}</MarketingFrame>;
}
