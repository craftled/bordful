import { assertMarketingEnabled } from "@/config/marketing-guard";

export default function TermsPage() {
  assertMarketingEnabled();

  return (
    <main>
      <h1>Terms</h1>
      <p>Coming soon</p>
    </main>
  );
}
