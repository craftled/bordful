import { assertMarketingEnabled } from "@/config/marketing-guard";

export default function AboutPage() {
  assertMarketingEnabled();

  return (
    <main>
      <h1>About</h1>
      <p>Coming soon</p>
    </main>
  );
}
