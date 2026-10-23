const CREDIT_HREF =
  "https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=credit&utm_campaign=board";

export function BordfeedCredit() {
  return (
    <a data-testid="bordfeed-credit" href={CREDIT_HREF} rel="noopener">
      Jobs by Bordfeed
    </a>
  );
}
