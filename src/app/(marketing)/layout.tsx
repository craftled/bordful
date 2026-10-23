import { headers } from "next/headers";
import type { ReactNode } from "react";

import "../globals.css";

export default async function MarketingLayout({
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
