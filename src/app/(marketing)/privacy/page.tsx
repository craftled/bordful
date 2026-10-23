import { assertMarketingEnabled } from "@/config/marketing-guard";

export default function PrivacyPage() {
  assertMarketingEnabled();

  return (
    <main>
      <h1>Privacy</h1>
      <p>Coming soon</p>
    </main>
  );
}
