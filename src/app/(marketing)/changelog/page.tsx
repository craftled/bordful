import { assertMarketingEnabled } from "@/config/marketing-guard";

export default function ChangelogPage() {
  assertMarketingEnabled();

  return (
    <main>
      <h1>Changelog</h1>
      <p>Coming soon</p>
    </main>
  );
}
