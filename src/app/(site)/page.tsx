import { MarketingHome } from "@/app/(marketing)/_components/marketing-home";
import { BoardHome } from "@/components/board/board-home";
import { isMarketingEnabled } from "@/config/flags";

export default function HomePage() {
  if (isMarketingEnabled()) {
    return <MarketingHome />;
  }

  return <BoardHome />;
}
