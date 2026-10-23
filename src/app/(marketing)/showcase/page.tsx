import { assertMarketingEnabled } from "@/config/marketing-guard";

export default function ShowcasePage() {
  assertMarketingEnabled();

  return (
    <main>
      <h1>Showcase</h1>
      <p>Coming soon</p>
    </main>
  );
}
