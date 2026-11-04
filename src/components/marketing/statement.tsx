import { Container } from "./container";
import { Section } from "./section";

// One sentence for what the board does, built from the feature list:
// Bordfeed jobs, Resend alerts and Stripe paid posts.
const parts = [
  { highlight: false, text: "Bordful" },
  { highlight: true, text: "lists" },
  { highlight: false, text: "jobs from your feed," },
  { highlight: true, text: "alerts" },
  { highlight: false, text: "people when new ones land, and" },
  { highlight: true, text: "charges" },
  { highlight: false, text: "employers to post." },
] as const;

export function Statement() {
  return (
    <Section className="hidden md:block md:py-14">
      <Container>
        <p className="text-subtle max-w-[760px] text-[22px] leading-[34px] font-medium tracking-[-0.025em] [word-spacing:1px] md:text-[28px] md:leading-[38px]">
          {parts.map((part, index) => (
            <span key={part.text}>
              {index > 0 ? " " : null}
              {part.highlight || index === 0 ? (
                <span
                  className={
                    part.highlight
                      ? "bg-tag text-foreground rounded-[7px] box-decoration-clone px-[7px]"
                      : "text-foreground"
                  }
                >
                  {part.text}
                </span>
              ) : (
                part.text
              )}
            </span>
          ))}
        </p>
      </Container>
    </Section>
  );
}
