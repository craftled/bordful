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
  hidePostCta = false,
}: {
  children: ReactNode;
  fullBleed?: boolean;
  // Post pages already are the post flow, so the footer band is redundant.
  hidePostCta?: boolean;
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
    <div className="bg-background text-foreground flex min-h-screen flex-col">
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
          <div className="max-w-board mx-auto w-full px-4 py-8">{children}</div>
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
          showCta={settings.postJob.enabled && !hidePostCta}
          social={social}
          tagline={settings.tagline}
        />
      )}
    </div>
  );
}
