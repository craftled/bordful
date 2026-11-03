"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { isActiveItem } from "@/components/board/nav-active";
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
  // otherwise close and reopen the menu. A tap outside is caught by
  // pointerdown for the same reason: iOS does not move focus on tap.
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

    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !wrapper?.contains(event.target)) {
        setOpen(false);
      }
    }

    wrapper.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      wrapper.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div className="flex md:hidden" ref={wrapperRef}>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label="Menu"
        className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-[30px] items-center justify-center rounded-md"
        onClick={toggle}
        ref={buttonRef}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-[18px]" />
        ) : (
          <Menu aria-hidden="true" className="size-[18px]" />
        )}
      </button>
      <div
        className="border-line bg-background absolute inset-x-0 top-[46px] z-30 border-b shadow-sm"
        hidden={!open}
        id={panelId}
        ref={panelRef}
      >
        <nav aria-label="Mobile" className="px-4 py-3">
          <ul className="flex flex-col">
            {items.map((item) => {
              const active = isActiveItem(pathname, item);
              return (
                <li key={item.id}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-2 py-2 text-[14px] ${
                      active
                        ? "bg-selected text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
