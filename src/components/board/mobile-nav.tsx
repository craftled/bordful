"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { isActivePath } from "@/components/board/nav-active";
import {
  SocialLinks,
  type SocialProfiles,
} from "@/components/board/social-links";
import type { NavItem } from "@/config/nav";

// Tailwind's md breakpoint.
const MD_BREAKPOINT_PX = 768;

export function MobileNav({
  items,
  social,
}: {
  items: NavItem[];
  social: SocialProfiles;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => setOpen(false), []);

  // Browser back and forward change the path without a link click.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // The panel is md:hidden, so an open menu would reappear when narrowing.
  useEffect(() => {
    function onResize() {
      if (window.innerWidth >= MD_BREAKPOINT_PX) {
        setOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    panelRef.current?.querySelector("a")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Closes when focus moves outside the menu. Focus that goes nowhere is
  // ignored: Safari does not focus buttons on click, so the toggle would
  // otherwise close and reopen the menu.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!(open && wrapper)) {
      return;
    }

    function onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget;
      if (next instanceof Node && !wrapper?.contains(next)) {
        setOpen(false);
      }
    }

    wrapper.addEventListener("focusout", onFocusOut);
    return () => wrapper.removeEventListener("focusout", onFocusOut);
  }, [open]);

  return (
    <div className="md:hidden" ref={wrapperRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label="Menu"
        className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={toggle}
        ref={buttonRef}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>
      <div
        className="absolute inset-x-0 top-14 z-30 border-border border-b bg-background shadow-sm"
        hidden={!open}
        id={panelId}
        ref={panelRef}
      >
        <nav aria-label="Mobile" className="mx-auto max-w-board px-4 py-3">
          <ul className="flex flex-col">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.id}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-2 py-2 text-sm ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                    href={item.href}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <SocialLinks className="mt-3 px-2" links={social} />
        </nav>
      </div>
    </div>
  );
}
