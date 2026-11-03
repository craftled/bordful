"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A fenced code block with a label bar and a Copy button.
export function DocsCodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [code]);

  return (
    <div className="bg-surface-sub ring-line-strong overflow-hidden rounded-[10px] ring-1 ring-inset">
      <div className="border-line flex h-[30px] items-center justify-between border-b px-3.5">
        <span className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase">
          {lang || "text"}
        </span>
        <button
          className="text-subtle hover:text-foreground text-[12px] leading-[17px] font-medium"
          onClick={copy}
          type="button"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="text-foreground m-0 overflow-x-auto rounded-none bg-transparent px-3.5 py-3 font-mono text-[12px] leading-5">
        <code className="bg-transparent p-0">{code}</code>
      </pre>
    </div>
  );
}
