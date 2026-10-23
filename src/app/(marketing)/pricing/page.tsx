import { assertMarketingEnabled } from "@/config/marketing-guard";

export default function PricingPage() {
  assertMarketingEnabled();

  return (
    <main>
      <h1>Pricing</h1>
      <p>Coming soon</p>
    </main>
  );
}
