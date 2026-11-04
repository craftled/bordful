"use client";

import {
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useId,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { PhoneShot, Shot, ThemedBoardShot, ThemedShot } from "./shots";

interface Step {
  description: string;
  id: string;
  label: string;
  shot: ReactNode;
}

// Paper's desktop panel: an 800x500 shot pinned 40px in from the top left and
// cropped by the panel edge.
const PANEL_SHOT =
  "absolute top-6 left-6 w-[640px] md:top-10 md:left-10 md:w-[800px]";

// Every line here is something the app does today: URL-driven filters, a page
// per job with a pinned mobile Apply bar, Resend alerts and browser-local saved
// jobs, the Stripe payment link with a listing duration, and Site settings.
const STEPS: readonly Step[] = [
  {
    description:
      "Search, then filter by type, level, salary, language, remote and visa sponsorship. Every view has its own URL.",
    id: "browse",
    label: "Browse and filter",
    shot: (
      <ThemedBoardShot
        alt="The board home with search, filter chips and the job list"
        className={PANEL_SHOT}
      />
    ),
  },
  {
    description:
      "Each job opens on its own page. On a phone, Apply stays pinned.",
    id: "read",
    label: "Read a role",
    shot: (
      <ThemedShot
        alt="A job page with salary, type, level and location above the description"
        className={PANEL_SHOT}
        name="jobLight"
      />
    ),
  },
  {
    description:
      "Visitors sign up for a daily or weekly email of new jobs, sent through Resend. Saved jobs stay in their browser.",
    id: "alerts",
    label: "Come back with alerts",
    shot: (
      <div className="absolute top-6 left-6 flex items-start gap-6 md:top-10 md:left-16 md:gap-8">
        <PhoneShot
          alt="The board home on a phone"
          className="w-[180px] md:w-[220px]"
          name="mobileHome"
        />
        <PhoneShot
          alt="A job page on a phone with the Apply bar pinned"
          className="mt-8 w-[180px] md:w-[220px]"
          name="mobileJob"
        />
      </div>
    ),
  },
  {
    description:
      "Employers pay through your Stripe payment link. You publish the job and it expires after the days you set.",
    id: "paid",
    label: "Take paid posts",
    shot: (
      <ThemedBoardShot
        alt="The board home with the job list"
        className={PANEL_SHOT}
      />
    ),
  },
  {
    description:
      "Name, logo, colors, fonts and radius come from Site settings, in light and dark.",
    id: "brand",
    label: "Make it yours",
    shot: (
      <>
        <Shot
          alt="The board in the light theme"
          className="absolute top-6 left-6 w-[560px] md:top-10 md:left-10 md:w-[640px]"
          name="boardLight"
        />
        <Shot
          alt="The board in the dark theme"
          className="absolute top-24 left-28 w-[560px] md:top-[120px] md:left-[200px] md:w-[640px]"
          name="boardDark"
        />
      </>
    ),
  },
];

function indexOf(event: { currentTarget: HTMLButtonElement }): number {
  return Number(event.currentTarget.dataset.index);
}

// Arrow keys move through the tabs and wrap; Home and End jump to the ends.
function targetIndex(key: string, index: number): number | null {
  const moves: Record<string, number> = {
    ArrowDown: index + 1,
    ArrowLeft: index - 1,
    ArrowRight: index + 1,
    ArrowUp: index - 1,
    End: STEPS.length - 1,
    Home: 0,
  };
  const target = moves[key];
  if (target === undefined) {
    return null;
  }

  return (target + STEPS.length) % STEPS.length;
}

export function Walkthrough() {
  const baseId = useId();
  const [active, setActive] = useState(1);

  const tabId = (step: Step) => `${baseId}-tab-${step.id}`;
  const panelId = (step: Step) => `${baseId}-panel-${step.id}`;

  const onClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setActive(indexOf(event));
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    const next = targetIndex(event.key, indexOf(event));
    if (next === null) {
      return;
    }

    event.preventDefault();
    setActive(next);
    event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  }, []);

  return (
    <section
      aria-labelledby={`${baseId}-heading`}
      className="border-line hidden scroll-mt-14 border-b md:block"
      id="product"
    >
      <div className="flex flex-col md:flex-row">
        <div className="flex flex-col gap-5 px-4 pt-10 pb-6 md:w-[300px] md:shrink-0 md:py-12 md:pr-8 md:pl-10">
          <p className="bg-tag text-muted-foreground flex h-5 items-center self-start rounded-sm px-[7px] text-[11px] leading-[14px] font-medium">
            Product
          </p>
          <h2
            className="text-foreground text-[22px] leading-7 font-medium tracking-[-0.02em]"
            id={`${baseId}-heading`}
          >
            Built for the people reading it
          </h2>
          <div
            aria-labelledby={`${baseId}-heading`}
            aria-orientation="vertical"
            className="flex flex-col"
            role="tablist"
          >
            {STEPS.map((step, index) => {
              const selected = index === active;

              return (
                <button
                  aria-controls={panelId(step)}
                  aria-describedby={
                    selected ? `${tabId(step)}-desc` : undefined
                  }
                  aria-labelledby={`${tabId(step)}-label`}
                  aria-selected={selected}
                  className={cn(
                    "group focus-visible:ring-ring relative flex flex-col gap-1.5 rounded-sm pl-4 text-left outline-none focus-visible:ring-2",
                    selected ? "pt-2.5 pb-3" : "py-2"
                  )}
                  data-index={index}
                  id={tabId(step)}
                  key={step.id}
                  onClick={onClick}
                  onKeyDown={onKeyDown}
                  role="tab"
                  tabIndex={selected ? 0 : -1}
                  type="button"
                >
                  <span
                    className={cn(
                      "text-[14px] leading-5 font-medium",
                      selected
                        ? "text-foreground"
                        : "group-hover:text-muted-foreground text-subtle"
                    )}
                    id={`${tabId(step)}-label`}
                  >
                    {step.label}
                  </span>
                  {selected ? (
                    <>
                      <span
                        className="text-muted-foreground text-[13px] leading-[19px]"
                        id={`${tabId(step)}-desc`}
                      >
                        {step.description}
                      </span>
                      <span
                        aria-hidden="true"
                        className="bg-foreground absolute top-2.5 bottom-3 left-0 w-0.5"
                      />
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        {STEPS.map((step, index) => (
          <div
            aria-labelledby={tabId(step)}
            className="border-line relative h-[320px] flex-1 overflow-hidden border-t bg-(--panel) sm:h-[400px] md:h-[460px] md:border-t-0 md:border-l"
            hidden={index !== active}
            id={panelId(step)}
            key={step.id}
            role="tabpanel"
          >
            {step.shot}
          </div>
        ))}
      </div>
    </section>
  );
}
