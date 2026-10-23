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
  const toggle = useCallback(() => setOpen((value) => !value), []);
  const close = useCallback(() => setOpen(false), []);

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

  return (
    <div className="md:hidden">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
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
        className="absolute inset-x-0 top-14 border-border border-b bg-background shadow-sm"
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
