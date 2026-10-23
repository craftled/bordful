import Link from "next/link";
import type { JSX, ReactNode } from "react";

import { BordfeedCredit } from "@/components/board/bordfeed-credit";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath, getNav } from "@/config/nav";
import { customSlots } from "@/custom";
import { getBordfeedConnectionPublic, getSiteSettings } from "@/lib/read";

export async function BoardShell({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const [settings, connection] = await Promise.all([
    getSiteSettings(),
    getBordfeedConnectionPublic(),
  ]);
  const marketing = isMarketingEnabled();
  const nav = getNav({
    alertsEnabled: settings.alerts.enabled,
    marketing,
    postJobEnabled: settings.postJob.enabled,
  });
  const HeaderSlot = customSlots.header;
  const FooterSlot = customSlots.footer;

  return (
    <div className="flex min-h-screen flex-col bg-background font-[var(--font-body)] text-foreground">
      {HeaderSlot ? (
        <HeaderSlot />
      ) : (
        <header className="border-border border-b" data-testid="site-header">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-3">
              {settings.logoUrl ? (
                // biome-ignore lint/performance/noImgElement: site-logo is a native img at 32px
                <img
                  alt=""
                  className="h-8 w-auto"
                  data-testid="site-logo"
                  height={32}
                  src={settings.logoUrl}
                  width={32}
                />
              ) : null}
              <Link
                className="font-[var(--font-heading)] font-semibold text-lg"
                data-testid="site-name"
                href={boardHomePath(marketing)}
              >
                {settings.name}
              </Link>
            </div>
            <nav
              className="flex flex-wrap gap-4 text-sm"
              data-testid="site-nav"
            >
              {nav.header.map((item) => (
                <Link href={item.href} key={item.id}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
      )}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
      {FooterSlot ? (
        <FooterSlot />
      ) : (
        <footer className="border-border border-t" data-testid="site-footer">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm">
            <nav className="flex flex-wrap gap-4">
              {nav.footer.map((item) => (
                <Link href={item.href} key={item.id}>
                  {item.label}
                </Link>
              ))}
            </nav>
            {connection.showAttribution ? <BordfeedCredit /> : null}
          </div>
        </footer>
      )}
    </div>
  );
}
