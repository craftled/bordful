// The id the board and marketing shells give their <main>.
export const MAIN_CONTENT_ID = "main-content";

// The first stop for keyboard users: hidden until focused, then it jumps
// past the header to the page's main landmark.
export function SkipLink() {
  return (
    <a
      className="focus:bg-background focus:text-foreground focus:ring-line-strong sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-[8px] focus:px-3 focus:py-2 focus:text-[13px] focus:leading-[18px] focus:font-medium focus:shadow-lg focus:ring-1"
      data-testid="skip-link"
      href={`#${MAIN_CONTENT_ID}`}
    >
      Skip to content
    </a>
  );
}
