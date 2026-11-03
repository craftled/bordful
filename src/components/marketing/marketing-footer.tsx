import Link from "next/link";

import { Container } from "./container";
import { MarketingImage } from "./marketing-image";
import { MARKETING_FOOTER_COLUMNS, type MarketingLink } from "./nav-links";
import { SOCIAL_LINKS } from "./site";

const linkClass = "text-muted-foreground hover:text-foreground rounded-sm";

function FooterLink({ item }: { item: MarketingLink }) {
  if (item.href.startsWith("/")) {
    return (
      <Link className={linkClass} href={item.href}>
        {item.label}
      </Link>
    );
  }

  return (
    <a
      className={linkClass}
      href={item.href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {item.label}
    </a>
  );
}

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer data-testid="marketing-footer">
      <Container className="flex flex-col gap-6 pt-8 pb-10 md:gap-8 md:pt-11 md:pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col gap-2.5 md:w-[280px] md:shrink-0">
            <Link
              className="hidden items-center gap-2 self-start md:flex"
              href="/"
            >
              <MarketingImage
                alt=""
                className="marketing-mono size-5"
                height={20}
                src="/marketing/logos/bordful.svg"
                width={20}
              />
              <span className="text-foreground text-[14px] leading-5 font-medium tracking-[-0.01em]">
                Bordful
              </span>
            </Link>
            <p className="text-muted-foreground text-[13px] leading-[19px]">
              Open-source job board template. Deploy to Vercel and start with
              real jobs from Bordfeed.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:flex md:gap-5">
            {MARKETING_FOOTER_COLUMNS.map((column) => (
              <nav
                aria-label={column.title}
                className="md:w-[130px] md:shrink-0"
                key={column.title}
              >
                <h2 className="text-subtle mb-2.5 text-[12px] leading-4 md:mb-2 md:font-mono md:text-[11px] md:leading-[14px] md:font-medium md:tracking-[0.04em] md:uppercase">
                  {column.title}
                </h2>
                <ul className="flex flex-col gap-2.5 text-[14px] leading-[18px] md:gap-2 md:text-[13px]">
                  {column.items.map((item) => (
                    <li key={item.href}>
                      <FooterLink item={item} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="text-subtle md:border-line flex flex-col gap-4 text-[12px] leading-4 md:flex-row md:items-center md:justify-between md:border-t md:pt-4">
          <p>
            &copy; {year} Bordful · MIT License · Built by{" "}
            <a
              className="hover:text-foreground rounded-sm"
              href="https://craftled.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Craftled
            </a>
          </p>
          <ul className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {SOCIAL_LINKS.map((link, index) => (
              <li className="flex items-center gap-1.5" key={link.href}>
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                <a
                  aria-label={link.name}
                  className="hover:text-foreground rounded-sm"
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
      </Container>
    </footer>
  );
}
