import Link from "next/link";

import { Separator } from "@/components/ui/separator";

import { Container } from "./container";
import { MarketingImage } from "./marketing-image";
import { MARKETING_FOOTER_COLUMNS } from "./nav-links";
import { SocialIconLinks } from "./social-icon-links";

const linkClass =
  "text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-border bg-secondary/50 border-t"
      data-testid="marketing-footer"
    >
      <Container className="flex flex-col gap-10 py-10 md:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link
              className="focus-visible:outline-ring flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
              href="/"
            >
              <MarketingImage
                alt=""
                className="marketing-mono h-5 w-5"
                height={20}
                src="/marketing/logos/bordful.svg"
                width={20}
              />
              <span className="text-sm font-medium">Bordful</span>
            </Link>
            <p className="text-muted-foreground max-w-[320px] text-sm">
              Open-source job board template. Deploy to Vercel and start with
              real jobs from Bordfeed.
            </p>
            <SocialIconLinks className="flex flex-wrap items-center gap-4" />
          </div>
          {MARKETING_FOOTER_COLUMNS.map((column) => (
            <nav aria-label={column.title} key={column.title}>
              <h2 className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
                {column.title}
              </h2>
              <ul className="space-y-2.5 text-sm">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link className={linkClass} href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Separator />
        <div className="text-muted-foreground flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Bordful</p>
          <p className="flex items-center gap-2">
            Built by
            <a
              className="text-foreground focus-visible:outline-ring inline-flex items-center gap-1 rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4"
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
          </p>
        </div>
      </Container>
    </footer>
  );
}
