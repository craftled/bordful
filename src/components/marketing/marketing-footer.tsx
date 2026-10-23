import Link from "next/link";

import { Separator } from "@/components/ui/separator";
import { getNav } from "@/config/nav";

import { Container } from "./container";
import { MarketingImage } from "./marketing-image";
import { SOCIAL_LINKS } from "./site";

const marketingNav = getNav({
  alertsEnabled: false,
  marketing: true,
  postJobEnabled: false,
});

export function MarketingFooter() {
  return (
    <footer
      className="border-border border-t bg-secondary/50"
      data-testid="marketing-footer"
    >
      <Container className="flex flex-col gap-8 py-8 md:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 sm:col-span-2">
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
            <p className="max-w-[320px] text-muted-foreground text-sm">
              Open-source job board template. Deploy to Vercel and start with
              real jobs from Bordfeed.
            </p>
            <ul className="flex flex-wrap gap-4 text-sm">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    className="text-muted-foreground hover:text-foreground"
                    href={link.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h2 className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Product
            </h2>
            <ul className="space-y-2.5 text-sm">
              {marketingNav.footer.map((item) => (
                <li key={item.id}>
                  <Link
                    className="text-muted-foreground hover:text-foreground"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            Bordful is MIT licensed. Standing on the shoulders of giants.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              A Craftled product
            </span>
            <a
              className="inline-flex items-center gap-1 font-medium text-xs"
              href="https://craftled.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              <MarketingImage
                alt=""
                className="marketing-mono h-4 w-4 rounded-full"
                height={16}
                src="/marketing/logos/craftled.svg"
                width={16}
              />
              Craftled
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
