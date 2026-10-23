import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getNav } from "@/config/nav";

import { Container } from "./container";
import { DEPLOY_URL } from "./links";
import { MarketingImage } from "./marketing-image";
import { GITHUB_URL } from "./site";

const marketingNav = getNav({
  alertsEnabled: false,
  marketing: true,
  postJobEnabled: false,
});

function NavLinks({ items }: { items: typeof marketingNav.header }) {
  return (
    <ul className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            className="text-[13px] text-muted-foreground hover:text-foreground"
            href={item.href}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
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
            <Link className="flex items-center gap-2" href="/">
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
              <NavLinks items={marketingNav.header} />
            </nav>
          </div>
          <div className="hidden lg:flex">
            <HeaderActions />
          </div>
          <details className="relative lg:hidden">
            <summary className="cursor-pointer rounded-full border border-border px-3 py-1 text-[13px]">
              Menu
            </summary>
            <div className="absolute right-0 mt-3 w-64 rounded-lg border border-border bg-background p-4">
              <nav aria-label="Mobile">
                <NavLinks items={marketingNav.header} />
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
