"use client";

import { useEffect } from "react";

import { DEPLOY_URL } from "./links";
import { GITHUB_URL } from "./site";

const HOTKEYS: Record<string, string> = {
  d: DEPLOY_URL,
  g: GITHUB_URL,
};

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

// D opens the Vercel deploy flow and G the GitHub repo, as the hints on the
// header and CTA buttons say. Keys typed into a field are left alone.
export function MarketingHotkeys() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTyping(event.target)
      ) {
        return;
      }

      const url = HOTKEYS[event.key.toLowerCase()];
      if (url) {
        event.preventDefault();
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
