import type { JSX, ReactNode } from "react";

import {
  BoardSearchForm,
  searchHiddenFields,
} from "@/components/board/board-search-form";
import { SiteFooter } from "@/components/board/site-footer";
import { SiteHeader } from "@/components/board/site-header";
import { bordfulConfig } from "@/config";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath, getNav } from "@/config/nav";
import { customSlots } from "@/custom";
import { buildTaxonomyArchivePath } from "@/lib/board/paths";
import { loadBoardPool } from "@/lib/board/pool";
import type { BoardQuery, BoardQueryOptions } from "@/lib/board/query";
import { getBordfeedConnectionPublic, getSiteSettings } from "@/lib/read";

export async function BoardShell({
  children,
  fullBleed = false,
  hidePostCta = false,
  search,
}: {
  children: ReactNode;
  fullBleed?: boolean;
  // Post pages already are the post flow, so the footer band is redundant.
  hidePostCta?: boolean;
  // Board listings pass their query so a header search keeps the filters,
  // and the search shows as a row under the brand bar on phones.
  search?: { options: BoardQueryOptions; query: BoardQuery };
}): Promise<JSX.Element> {
  const [settings, connection, pool] = await Promise.all([
    getSiteSettings(),
    getBordfeedConnectionPublic(),
    loadBoardPool(),
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
  const remoteCount = pool.filter(
    (card) => card.workplaceType === "remote"
  ).length;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {HeaderSlot ? (
        <HeaderSlot />
      ) : (
        <SiteHeader
          bordfulMark={marketing}
          cta={nav.cta}
          homeHref={boardHomePath(marketing)}
          logoUrl={settings.logoUrl}
          name={settings.name}
          navItems={nav.header}
          search={
            <BoardSearchForm
              count={pool.length}
              hidden={
                search ? searchHiddenFields(search.query, search.options) : []
              }
              q={search?.query.q ?? ""}
            />
          }
          searchOnPhone={search !== undefined}
          social={social}
          views={{
            allCount: pool.length,
            allHref: boardHomePath(marketing),
            remoteCount,
            remoteHref: buildTaxonomyArchivePath("location", "remote"),
          }}
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
          bordfulMark={marketing}
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
