"use client";

import { type ComponentProps, useEffect, useRef } from "react";

const OPEN_MENUS = "details[data-menu][open]";

// A <details> dropdown that behaves like a menu once JS runs: Escape closes
// it and returns focus to the summary, opening one closes the others, and an
// outside click or a picked link closes it. Without JS it is still a plain
// disclosure of crawlable links.
export function MenuDetails(props: ComponentProps<"details">) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = ref.current;
    if (!details) {
      return;
    }

    const onToggle = () => {
      if (!details.open) {
        return;
      }
      for (const other of document.querySelectorAll<HTMLDetailsElement>(
        OPEN_MENUS
      )) {
        if (other !== details) {
          other.open = false;
        }
      }
    };

    // A link click closes the menu, since client navigation keeps it mounted.
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) {
        details.open = false;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        details.open &&
        event.target instanceof Node &&
        !details.contains(event.target)
      ) {
        details.open = false;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !details.open) {
        return;
      }
      details.open = false;
      details.querySelector("summary")?.focus();
    };

    details.addEventListener("toggle", onToggle);
    details.addEventListener("click", onClick);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      details.removeEventListener("toggle", onToggle);
      details.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return <details {...props} data-menu="" ref={ref} />;
}
