import Link from "next/link";

import { Container } from "./container";
import { MarketingLogo } from "./marketing-header";
import { MARKETING_FOOTER_COLUMNS, type MarketingLink } from "./nav-links";
import { SOCIAL_LINKS } from "./site";

const linkClass = "text-muted-foreground hover:text-foreground rounded-sm";

// Paper's footer lists three of the social profiles, in this order.
const FOOTER_SOCIALS = ["X", "GitHub", "Reddit"].flatMap((label) =>
  SOCIAL_LINKS.filter((link) => link.label === label)
);

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

export function MarketingFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className={className} data-testid="marketing-footer">
      <Container className="flex flex-col gap-6 pt-8 pb-10 md:gap-8 md:pt-11 md:pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col gap-2.5 md:w-[280px] md:shrink-0">
            <div className="hidden self-start md:block">
              <MarketingLogo />
            </div>
            <p className="text-muted-foreground text-[13px] leading-4 md:leading-[19px]">
              Open-source job board software. Made by{" "}
              <a
                className="hover:text-foreground rounded-sm"
                href="https://craftled.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                Craftled
              </a>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-6 md:flex-nowrap md:gap-5">
            {MARKETING_FOOTER_COLUMNS.map((column) => (
              <nav
                aria-label={column.title}
                className="w-[calc(50%-8px)] md:w-[130px] md:shrink-0"
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
          <p>&copy; {year} Craftled · MIT License</p>
          <ul className="hidden items-center gap-x-[3px] md:flex">
            {FOOTER_SOCIALS.map((link, index) => (
              <li className="flex items-center gap-[3px]" key={link.href}>
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

// Paper's slim desktop footer for the inner marketing pages (features,
// pricing, showcase, FAQ, terms, privacy): a 58px bar in place of the full
// footer, which the shell hides at md+ once this is on the page. Phones keep
// the full footer.
export function MarketingSlimFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-line hidden items-center justify-between border-t px-6 py-5 text-[12px] leading-[17px] md:mt-auto md:flex"
      data-slim-footer=""
      data-testid="marketing-slim-footer"
    >
      <p className="text-subtle">&copy; {year} Craftled · MIT License</p>
      <a
        className="text-muted-foreground hover:text-foreground rounded-sm font-medium"
        href="https://bordful.com"
      >
        bordful.com
      </a>
    </footer>
  );
}
