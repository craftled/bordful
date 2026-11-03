import { Button } from "@/components/ui/button";

import { Kbd } from "./kbd";
import { DEPLOY_URL } from "./links";
import { Shot } from "./shots";
import { GITHUB_URL } from "./site";

// Paper's closing band on the home page. It stays dark in both themes:
// .marketing-dark pins the dark palette, and the band shade follows the theme.
export function FinalCta() {
  return (
    <section className="marketing-dark border-line text-foreground relative overflow-hidden border-b bg-(--band) md:h-[320px]">
      <div
        aria-hidden="true"
        className="marketing-cta-glow pointer-events-none absolute inset-0"
      />
      <div className="relative flex flex-col gap-[18px] px-4 py-12 md:px-10 md:py-[72px]">
        <h2 className="flex max-w-[480px] flex-col text-[30px] leading-9 font-medium tracking-[-0.035em] md:text-[40px] md:leading-[44px]">
          <span>Launch your board.</span>
          <span className="text-foreground/42"> Make it yours later.</span>
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-1.5">
          <Button
            asChild
            className="h-11 gap-[7px] px-3.5 text-[15px] sm:h-9 sm:text-[13px]"
          >
            <a href={DEPLOY_URL} rel="noopener noreferrer" target="_blank">
              Deploy to Vercel
              <Kbd className="bg-primary-foreground/8 text-primary-foreground/60">
                D
              </Kbd>
            </a>
          </Button>
          <Button
            asChild
            className="text-foreground ring-foreground/15 hover:bg-tag h-11 gap-[7px] border-0 bg-transparent px-3.5 text-[15px] shadow-none ring-1 ring-inset sm:h-9 sm:text-[13px]"
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
