const CREDIT_HREF =
  "https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=credit&utm_campaign=board";

export function BordfeedCredit() {
  return (
    <a
      className="hover:text-foreground transition-colors"
      data-testid="bordfeed-credit"
      href={CREDIT_HREF}
      rel="noopener"
    >
      Jobs by Bordfeed
    </a>
  );
}
