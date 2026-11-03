import { Button } from "@/components/ui/button";

import { Kbd } from "./kbd";
import { DEPLOY_URL } from "./links";
import { Shot } from "./shots";
import { GITHUB_URL } from "./site";

// Paper's closing band on the home page. It stays dark in both themes:
// .marketing-dark pins the dark palette, and the band shade follows the theme.
export function FinalCta() {
  return (
    <>
      <PhoneCta />
      <DesktopCta />
    </>
  );
}

// Paper's phone close: centered, in the page's own theme, with full-width
// buttons. "Clone now" is the same Vercel clone as Deploy to Vercel.
function PhoneCta() {
  return (
    <section
      aria-labelledby="marketing-cta-phone-heading"
      className="border-line flex flex-col gap-5 border-b px-4 py-10 md:hidden"
    >
      <h2
        className="text-foreground flex flex-col text-center text-[28px] leading-[34px] font-medium tracking-[-0.035em]"
        id="marketing-cta-phone-heading"
      >
        <span>Launch your board.</span>
        <span className="text-subtle"> Make it yours later.</span>
      </h2>
      <p className="text-muted-foreground text-center text-[15px] leading-[18px]">
        Deploy free. Change everything after.
      </p>
      <div className="flex flex-col gap-2">
        <Button asChild className="h-11 px-3.5 text-[15px] leading-[18px]">
          <a href={DEPLOY_URL} rel="noopener noreferrer" target="_blank">
            Clone now
          </a>
        </Button>
        <Button
          asChild
          className="h-11 px-3.5 text-[15px] leading-[18px] shadow-xs"
          variant="outline"
        >
          <a href="/jobs">
            <span>
              Live demo <span aria-hidden="true">&#8599;</span>
            </span>
          </a>
        </Button>
      </div>
    </section>
  );
}

function DesktopCta() {
  return (
    <section className="marketing-dark border-line text-foreground relative hidden h-[320px] overflow-hidden border-b bg-(--band) md:block">
      <div
        aria-hidden="true"
        className="marketing-cta-glow pointer-events-none absolute inset-0"
      />
      <div className="relative flex flex-col gap-[18px] px-10 py-[72px]">
        <h2 className="flex max-w-[480px] flex-col text-[40px] leading-[44px] font-medium tracking-[-0.035em]">
          <span>Launch your board.</span>
          <span className="text-foreground/42"> Make it yours later.</span>
        </h2>
        <div className="flex flex-row gap-1.5">
          <Button asChild className="h-9 gap-[7px] px-3.5 text-[13px]">
            <a href={DEPLOY_URL} rel="noopener noreferrer" target="_blank">
              Deploy to Vercel
              <Kbd className="bg-primary-foreground/8 text-primary-foreground/60">
                D
              </Kbd>
            </a>
          </Button>
          <Button
            asChild
            className="text-foreground ring-foreground/15 hover:bg-tag h-9 gap-[7px] border-0 bg-transparent px-3.5 text-[13px] shadow-none ring-1 ring-inset"
            variant="outline"
          >
            <a href={GITHUB_URL} rel="noopener noreferrer" target="_blank">
              Star on GitHub
              <Kbd className="bg-foreground/15 text-foreground">G</Kbd>
            </a>
          </Button>
        </div>
      </div>
      <Shot
        alt=""
        className="absolute top-14 left-[53.33%] hidden h-[319px] w-[560px] rounded-[10px] shadow-[0_0_0_1px_rgb(255_255_255/10%)] lg:block"
        name="boardDark"
      />
    </section>
  );
}
