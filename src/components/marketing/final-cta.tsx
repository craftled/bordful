import { Button } from "@/components/ui/button";

import { Kbd } from "./kbd";
import { DEPLOY_URL } from "./links";
import { Shot } from "./shots";
import { GITHUB_URL } from "./site";

// Paper's closing band on the home page. It stays dark in both themes: the
// light theme inverts foreground and background, the dark theme lifts it to
// the card surface.
export function FinalCta() {
  return (
    <section className="marketing-inverse border-line bg-foreground text-background dark:bg-card dark:text-foreground relative overflow-hidden border-b">
      <div
        aria-hidden="true"
        className="marketing-cta-glow pointer-events-none absolute inset-0"
      />
      <div className="relative flex flex-col gap-[18px] px-4 py-12 md:min-h-[320px] md:px-10 md:py-[72px]">
        <h2 className="flex max-w-[480px] flex-col text-[30px] leading-9 font-medium tracking-[-0.035em] md:text-[40px] md:leading-[44px]">
          <span>Launch your board.</span>
          <span className="text-background/55 dark:text-subtle">
            {" "}
            Make it yours later.
          </span>
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <Button
            asChild
            className="bg-background text-foreground hover:bg-background/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 gap-[7px] px-3.5"
          >
            <a href={DEPLOY_URL} rel="noopener noreferrer" target="_blank">
              Deploy to Vercel
              <Kbd className="bg-foreground/8 text-muted-foreground dark:bg-primary-foreground/8">
                D
              </Kbd>
            </a>
          </Button>
          <Button
            asChild
            className="text-background ring-background/15 hover:bg-background/10 dark:text-foreground dark:ring-line-strong dark:hover:bg-tag gap-[7px] border-0 bg-transparent px-3.5 ring-1 ring-inset"
            variant="outline"
          >
            <a href={GITHUB_URL} rel="noopener noreferrer" target="_blank">
              Star on GitHub
              <Kbd className="bg-background/15 text-background dark:bg-foreground/15 dark:text-foreground">
                G
              </Kbd>
            </a>
          </Button>
        </div>
      </div>
      <Shot
        alt=""
        className="ring-background/10 dark:ring-line-strong absolute top-14 left-[53.33%] hidden h-[319px] w-[46.67%] rounded-[10px] shadow-none lg:block"
        name="boardDark"
      />
    </section>
  );
}
