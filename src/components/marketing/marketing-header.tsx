import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Container } from "./container";
import { DEPLOY_URL } from "./links";
import { MarketingImage } from "./marketing-image";
import { MARKETING_HEADER_LINKS, type MarketingLink } from "./nav-links";
import { GITHUB_URL } from "./site";
import { SocialIconLinks } from "./social-icon-links";

function NavLinks({
  items,
  native = false,
}: {
  items: MarketingLink[];
  native?: boolean;
}) {
  const className =
    "text-[13px] text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4";

  return (
    <ul className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
      {items.map((item) => (
        <li key={item.href}>
          {native ? (
            <a className={className} href={item.href}>
              {item.label}
            </a>
          ) : (
            <Link className={className} href={item.href}>
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <SocialIconLinks className="mr-2 flex items-center gap-3" />
      <Button asChild className="rounded-full" size="sm" variant="outline">
        <Link href="/jobs">Live demo</Link>
      </Button>
      <Button asChild className="rounded-full" size="sm" variant="outline">
        <a href={GITHUB_URL} rel="noopener noreferrer" target="_blank">
          <MarketingImage
            alt=""
            className="marketing-mono h-4 w-4"
            height={16}
            src="/marketing/logos/github.svg"
            width={16}
          />
          GitHub
        </a>
      </Button>
      <Button asChild className="rounded-full" size="sm">
        <a href={DEPLOY_URL} rel="noopener noreferrer" target="_blank">
          Deploy
        </a>
      </Button>
    </div>
  );
}

export function MarketingHeader() {
  return (
    <header
      className="fixed top-4 right-0 left-0 z-50"
      data-testid="marketing-header"
    >
      <Container>
        <div className="flex h-14 items-center justify-between rounded-full border border-border bg-background/60 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
              href="/"
            >
              <MarketingImage
                alt=""
                className="marketing-mono h-5 w-5"
                height={20}
                src="/marketing/logos/bordful.svg"
                width={20}
              />
              <span className="font-medium text-sm">Bordful</span>
            </Link>
            <nav aria-label="Primary" className="hidden lg:block">
              <NavLinks items={MARKETING_HEADER_LINKS} />
            </nav>
          </div>
          <div className="hidden lg:flex">
            <HeaderActions />
          </div>
          <details className="relative lg:hidden">
            <summary className="cursor-pointer rounded-full border border-border px-3 py-1 text-[13px] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
              Menu
            </summary>
            <div className="absolute right-0 mt-3 w-64 rounded-lg border border-border bg-background p-4">
              <nav aria-label="Mobile">
                {/* A full load closes this disclosure. Client navigation leaves it open. */}
                <NavLinks items={MARKETING_HEADER_LINKS} native />
              </nav>
              <div className="mt-4">
                <HeaderActions />
              </div>
            </div>
          </details>
        </div>
      </Container>
    </header>
  );
}
