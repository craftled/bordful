import type { JSX, ReactNode } from "react";

import { SiteFooter } from "@/components/board/site-footer";
import { SiteHeader } from "@/components/board/site-header";
import { bordfulConfig } from "@/config";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath, getNav } from "@/config/nav";
import { customSlots } from "@/custom";
import { getBordfeedConnectionPublic, getSiteSettings } from "@/lib/read";

export async function BoardShell({
  children,
  fullBleed = false,
}: {
  children: ReactNode;
  fullBleed?: boolean;
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
  const { social } = bordfulConfig;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {HeaderSlot ? (
        <HeaderSlot />
      ) : (
        <SiteHeader
          cta={nav.cta}
          homeHref={boardHomePath(marketing)}
          logoUrl={settings.logoUrl}
          name={settings.name}
          navItems={nav.header}
          social={social}
        />
      )}
      <main className="flex-1">
        {fullBleed ? (
          children
        ) : (
          <div className="mx-auto w-full max-w-board px-4 py-8">{children}</div>
        )}
      </main>
      {FooterSlot ? (
        <FooterSlot />
      ) : (
        <SiteFooter
          columns={nav.footerColumns}
          durationDays={settings.postJob.durationDays}
          logoUrl={settings.logoUrl}
          name={settings.name}
          priceLabel={settings.postJob.priceLabel}
          showAttribution={connection.showAttribution}
          showCta={settings.postJob.enabled}
          social={social}
          tagline={settings.tagline}
        />
      )}
    </div>
  );
}
