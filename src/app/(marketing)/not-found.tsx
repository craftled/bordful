import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { isMarketingEnabled } from "@/config/flags";

export async function generateMetadata(): Promise<Metadata> {
  await headers();

  if (!isMarketingEnabled()) {
    return {};
  }

  return {
    description: "That page is not on this site.",
    title: "Page not found",
  };
}

export function MarketingNotFound({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <main>
        <h1>Page not found</h1>
        <p>
          <Link href="/">Home</Link>
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-[640px] flex-col items-center justify-center gap-7 px-4 pt-16 pb-12 text-center md:min-h-[1000px]">
      <div className="flex flex-col items-center gap-3 md:gap-2">
        <p className="text-subtle font-mono text-[11px] font-medium tracking-[0.04em] uppercase">
          Error 404
        </p>
        <div className="flex flex-col items-center">
          <h1 className="text-foreground text-[72px] leading-[88px] font-medium tracking-[-0.045em] md:text-[88px] md:leading-[92px]">
            404
          </h1>
          <p className="text-subtle text-[24px] leading-[30px] font-medium tracking-[-0.03em] md:text-[32px] md:leading-[38px]">
            Page not found.
          </p>
        </div>
      </div>
      <p className="text-muted-foreground max-w-[420px] text-[15px] leading-[23px]">
        Sorry, we could not find that page.
      </p>
      <div className="flex gap-2">
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-[14px] leading-5 font-medium"
          href="/"
        >
          Home
        </Link>
      </div>
    </div>
  );
}

export default function NotFound() {
  return <MarketingNotFound enabled={isMarketingEnabled()} />;
}
