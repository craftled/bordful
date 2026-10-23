import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";

import "../globals.css";

export const metadata: Metadata = {
  title: "Bordful",
};

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  await headers();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
