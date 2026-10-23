import Link from "next/link";

import { Separator } from "@/components/ui/separator";

import { Container } from "./container";
import { MarketingImage } from "./marketing-image";
import { MARKETING_FOOTER_COLUMNS } from "./nav-links";
import { SOCIAL_LINKS } from "./site";

const linkClass =
  "text-muted-foreground hover:text-foreground focus-visible:rounded-sm focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-border border-t bg-secondary/50"
      data-testid="marketing-footer"
    >
      <Container className="flex flex-col gap-10 py-10 md:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
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
            <p className="max-w-[320px] text-muted-foreground text-sm">
              Open-source job board template. Deploy to Vercel and start with
              real jobs from Bordfeed.
            </p>
            <ul className="flex flex-wrap items-center gap-4">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    aria-label={link.name}
                    className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
                    href={link.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <MarketingImage
                      alt=""
                      className="marketing-mono h-4 w-4 opacity-80 hover:opacity-100"
                      height={16}
                      src={link.icon}
                      width={16}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {MARKETING_FOOTER_COLUMNS.map((column) => (
            <nav aria-label={column.title} key={column.title}>
              <h2 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
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
        <div className="flex flex-col gap-4 text-muted-foreground text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} Bordful</p>
          <p className="flex items-center gap-2">
            Built by
            <a
              className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
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
