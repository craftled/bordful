import { ChevronRight } from "lucide-react";
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

// Paper's phone 404 lists the three places most visitors were heading.
const PHONE_LINKS = [
  {
    description: "Set up and configure your board.",
    href: "/docs",
    label: "Docs",
  },
  {
    description: "Free to self-host, or we set it up.",
    href: "/pricing",
    label: "Pricing",
  },
  {
    description: "Boards built with Bordful.",
    href: "/showcase",
    label: "Showcase",
  },
] as const;

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

  const year = new Date().getFullYear();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center px-4 pt-16 pb-12 text-center md:justify-center md:gap-7 md:py-16">
        <div className="flex flex-col items-center gap-3 md:gap-2">
          <p className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase">
            Error 404
          </p>
          <div className="flex flex-col items-center gap-3 md:gap-0">
            <h1 className="text-foreground text-[72px] leading-[88px] font-medium tracking-[-0.045em] md:text-[88px] md:leading-[92px]">
              404
            </h1>
            <p className="text-subtle/80 text-[24px] leading-[30px] font-medium tracking-[-0.03em] md:text-[32px] md:leading-[38px]">
              Page not found.
            </p>
            <p className="text-muted-foreground text-[14px] leading-[18px] md:hidden">
              The page moved or never existed.
            </p>
          </div>
        </div>
        <p className="text-muted-foreground hidden max-w-[420px] text-[15px] leading-[23px] md:block">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="hidden gap-2 md:flex">
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-[14px] leading-5 font-medium"
            href="/"
          >
            Go Home
          </Link>
          <Link
            className="bg-card text-foreground ring-line-strong hover:bg-surface-sub inline-flex h-9 items-center justify-center rounded-md px-4 text-[14px] leading-5 font-medium ring-1"
            href="/docs"
          >
            Read the docs
          </Link>
        </div>
        <div className="mt-8 flex w-full flex-col gap-3 text-left md:hidden">
          <Link
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 w-full items-center justify-center rounded-md px-3.5 text-[15px] leading-[18px] font-medium"
            href="/"
          >
            Go to the homepage
          </Link>
          <ul className="bg-card ring-line flex flex-col overflow-hidden rounded-[14px] ring-1">
            {PHONE_LINKS.map((link) => (
              <li
                className="border-line border-b last:border-b-0"
                key={link.href}
              >
                <Link
                  className="hover:bg-surface-sub flex items-center gap-3 px-4 py-3.5"
                  href={link.href}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-foreground text-[15px] leading-[18px] font-medium">
                      {link.label}
                    </span>
                    <span className="text-muted-foreground text-[13px] leading-4">
                      {link.description}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="text-subtle size-3.5 shrink-0"
                    strokeWidth={1.8}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <footer
        className="border-line hidden items-center justify-between border-t px-6 py-5 text-[12px] leading-[17px] md:flex"
        data-slim-footer=""
      >
        <p className="text-subtle">&copy; {year} Craftled · MIT License</p>
        <a
          className="text-muted-foreground hover:text-foreground rounded-sm font-medium"
          href="https://bordful.com"
        >
          bordful.com
        </a>
      </footer>
    </div>
  );
}

export default function NotFound() {
  return <MarketingNotFound enabled={isMarketingEnabled()} />;
}
