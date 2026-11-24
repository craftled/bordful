"use client";

import { Check, Copy, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The AI links shared by every docs page. Pure so it is unit tested: the
// prompt points the assistant at the page's markdown URL.
export function docsAiLinks(mdUrl: string): {
  chatgpt: string;
  claude: string;
  prompt: string;
} {
  const prompt = `Read ${mdUrl} and help me with questions about it.`;
  const query = new URLSearchParams({ q: prompt });
  return {
    chatgpt: `https://chatgpt.com/?hints=search&${query}`,
    claude: `https://claude.ai/new?${query}`,
    prompt,
  };
}

const COPIED_MESSAGE = "Copied page as Markdown.";
const COPY_FAILED_MESSAGE = "Could not copy. Open the Markdown page instead.";
const RESET_MS = 1500;

const LINK_CLASS =
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 inline-flex shrink-0 items-center justify-center gap-[7px] rounded-lg text-[13px] leading-4 font-medium whitespace-nowrap transition-colors outline-none focus-visible:shadow-[0_0_0_2px_var(--background),0_0_0_3.5px_var(--primary)] disabled:pointer-events-none disabled:opacity-[0.45] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-line-strong bg-card hover:bg-surface-sub border text-foreground h-11 px-3.5 md:h-8";

// Copy the page's markdown through a same-origin fetch, so Safari keeps the
// user gesture (ClipboardItem) and every other browser falls back to
// writeText. No script is injected and no new CSP origin is needed.
async function copyMarkdown(
  mdPath: string,
  clipboard: Pick<Navigator["clipboard"], "write" | "writeText">,
  fetchImpl: typeof fetch
): Promise<boolean> {
  try {
    if (typeof ClipboardItem !== "undefined" && clipboard.write) {
      const blob = fetchImpl(mdPath).then((response) =>
        response.ok
          ? response.blob()
          : Promise.reject(new Error(`HTTP ${response.status}`))
      );
      await clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return true;
    }
  } catch {
    // Fall through to writeText.
  }
  try {
    const response = await fetchImpl(mdPath);
    if (!response.ok) {
      return false;
    }
    await clipboard.writeText(await response.text());
    return true;
  } catch {
    return false;
  }
}

export function DocsPageActions({
  mdPath,
  mdUrl,
}: {
  /** Same-origin markdown URL, e.g. /docs/deploy.md. */
  mdPath: string;
  /** Absolute markdown URL, e.g. https://bordful.com/docs/deploy.md. */
  mdUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { chatgpt, claude } = docsAiLinks(mdUrl);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const onCopy = useCallback(async () => {
    const ok = await copyMarkdown(
      mdPath,
      navigator.clipboard,
      globalThis.fetch
    );
    setCopied(ok);
    setFailed(!ok);
    setMessage(ok ? COPIED_MESSAGE : COPY_FAILED_MESSAGE);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), RESET_MS);
  }, [mdPath]);

  return (
    <aside
      aria-label="Use this page with AI"
      className="flex flex-wrap items-center gap-2"
      data-markdown-ignore
    >
      <Button
        // No aria-label: the visible "Copy as Markdown" text is the
        // accessible name (voice control speaks what is on screen), and it
        // flips to "Copied" with the status announcement below.
        className={cn(LINK_CLASS, "gap-[7px] px-3.5")}
        onClick={onCopy}
        type="button"
        variant="outline"
      >
        {copied ? (
          <Check aria-hidden="true" className="size-4" strokeWidth={1.8} />
        ) : (
          <Copy aria-hidden="true" className="size-4" strokeWidth={1.8} />
        )}
        {copied ? "Copied" : "Copy as Markdown"}
      </Button>
      <span className="sr-only" role="status">
        {message}
      </span>
      <a
        className={LINK_CLASS}
        href={chatgpt}
        rel="noopener noreferrer"
        target="_blank"
      >
        Open in ChatGPT
        <ExternalLink aria-hidden="true" className="size-4" strokeWidth={1.8} />{" "}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      <a
        className={LINK_CLASS}
        href={claude}
        rel="noopener noreferrer"
        target="_blank"
      >
        Open in Claude
        <ExternalLink aria-hidden="true" className="size-4" strokeWidth={1.8} />{" "}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      {failed ? (
        // Same-origin .md URL: it opens in this tab, so no new-tab
        // announcement and no target="_blank" here.
        <a className={LINK_CLASS} href={mdPath}>
          Open the Markdown page
        </a>
      ) : null}
    </aside>
  );
}
