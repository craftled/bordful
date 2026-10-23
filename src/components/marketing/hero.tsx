import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Container } from "./container";
import { DEPLOY_URL } from "./links";
import { MarketingImage } from "./marketing-image";
import { Section } from "./section";
import { GITHUB_URL } from "./site";

export function Hero() {
  return (
    <Section className="overflow-hidden" padding="hero">
      <Container>
        <div className="mx-auto max-w-[980px] pb-12">
          <div className="flex flex-col items-start gap-6">
            <Badge variant="outline">Open-source job board template</Badge>
            <h1 className="font-medium text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Live in two minutes{" "}
              <span className="text-muted-foreground">
                with real jobs from Bordfeed
              </span>
            </h1>
            <p className="max-w-[600px] text-base text-muted-foreground">
              Deploy the template and the board is already filled with sample
              jobs. Connect Bordfeed for your own feed, post jobs through a
              Stripe payment link, and send email alerts with Resend.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="h-10 rounded-full px-6">
                <a
                  data-testid="marketing-deploy-button"
                  href={DEPLOY_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Deploy to Vercel
                </a>
              </Button>
              <Button
                asChild
                className="h-10 rounded-full px-6"
                variant="outline"
              >
                <a data-testid="marketing-demo-link" href="/jobs">
                  Live demo
                </a>
              </Button>
              <Button
                asChild
                className="h-10 rounded-full px-6"
                variant="outline"
              >
                <a href={GITHUB_URL} rel="noopener noreferrer" target="_blank">
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[1080px] overflow-hidden rounded-lg border bg-background">
          <MarketingImage
            alt="Bordful demo board"
            className="w-full"
            height={1215}
            src="/marketing/bordful-demo.png"
            width={2160}
          />
        </div>
      </Container>
    </Section>
  );
}
