import { headers } from "next/headers";
import Link from "next/link";

import "./globals.css";

export default async function GlobalNotFound() {
  await headers();

  return (
    <html lang="en">
      <body>
        <h1>Page not found</h1>
        <p>
          <Link href="/">Home</Link>
        </p>
      </body>
    </html>
  );
}
