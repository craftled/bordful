import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { geist } from "@/components/marketing/fonts";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MARKETING_DESCRIPTION } from "@/components/marketing/site";
import { resolveServerUrl } from "@/config/server-url";

import "@/components/marketing/marketing.css";
import "../globals.css";

const title = "Bordful: open-source job board template";
const image = {
  alt: title,
  height: 630,
  url: "/marketing/bordful-job-board-software.png",
  width: 1200,
};

export const metadata: Metadata = {
  description: MARKETING_DESCRIPTION,
  icons: {
    apple: "/marketing/apple-icon.png",
    icon: "/marketing/icon.svg",
  },
  metadataBase: new URL(resolveServerUrl()),
  openGraph: {
    description: MARKETING_DESCRIPTION,
    images: [image],
    locale: "en_US",
    siteName: "Bordful",
    title,
    type: "website",
  },
  title: {
    default: title,
    template: "%s | Bordful",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@bordful",
    description: MARKETING_DESCRIPTION,
    images: [image.url],
    site: "@bordful",
    title,
  },
};

export default async function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  await headers();

  return (
    <html lang="en">
      <body className={`${geist.variable} bordful-marketing antialiased`}>
        <div className="relative flex min-h-screen flex-col">
          <MarketingHeader />
          <main className="flex-1">{children}</main>
          <MarketingFooter />
        </div>
      </body>
    </html>
  );
}
