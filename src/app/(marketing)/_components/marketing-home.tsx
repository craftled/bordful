import { assertMarketingEnabled } from "@/config/marketing-guard";

export async function MarketingHome() {
  assertMarketingEnabled();

  const { MarketingHomeView } = await import("./marketing-home-view");

  return <MarketingHomeView />;
}
