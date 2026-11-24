// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { DocsPageActions, docsAiLinks } from "./docs-page-actions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const mdPath = "/docs/deploy.md";
const mdUrl = "https://bordful.com/docs/deploy.md";

test("docsAiLinks builds prompts from the absolute markdown URL", () => {
  const links = docsAiLinks(mdUrl);
  const prompt = `Read ${mdUrl} and help me with questions about it.`;
  const query = new URLSearchParams({ q: prompt }).toString();
  expect(links.chatgpt).toBe(`https://chatgpt.com/?hints=search&${query}`);
  expect(links.claude).toBe(`https://claude.ai/new?${query}`);
  expect(links.prompt).toBe(prompt);
  expect(decodeURIComponent(query)).toContain(mdUrl);
});

test("renders the three controls with names, hrefs and safety attributes", () => {
  render(<DocsPageActions mdPath={mdPath} mdUrl={mdUrl} />);

  const wrapper = screen.getByRole("complementary");
  expect(wrapper.getAttribute("aria-label")).toBe("Use this page with AI");
  expect(wrapper.hasAttribute("data-markdown-ignore")).toBe(true);

  const copy = screen.getByRole("button", {
    name: "Copy page as Markdown",
  }) as HTMLButtonElement;
  expect(copy.type).toBe("button");

  const chatgpt = screen.getByRole("link", {
    name: "Open in ChatGPT (opens in a new tab)",
  }) as HTMLAnchorElement;
  expect(chatgpt.href).toBe(
    `https://chatgpt.com/?hints=search&${new URLSearchParams({
      q: `Read ${mdUrl} and help me with questions about it.`,
    })}`
  );
  expect(chatgpt.target).toBe("_blank");
  expect(chatgpt.rel).toBe("noopener noreferrer");

  const claude = screen.getByRole("link", {
    name: "Open in Claude (opens in a new tab)",
  }) as HTMLAnchorElement;
  expect(claude.href).toBe(
    `https://claude.ai/new?${new URLSearchParams({
      q: `Read ${mdUrl} and help me with questions about it.`,
    })}`
  );
  expect(claude.target).toBe("_blank");
  expect(claude.rel).toBe("noopener noreferrer");
});

// A ClipboardItem stand-in: jsdom has none, and Node's global may.
function makeClipboardItemClass(): typeof ClipboardItem {
  return class FakeClipboardItem {
    readonly items: Record<string, Promise<Blob>>;

    constructor(items: Record<string, Promise<Blob>>) {
      this.items = items;
    }
  } as unknown as typeof ClipboardItem;
}

function stubClipboard(mode: "item" | "text-only" | "failing") {
  const write = vi.fn(() => {
    if (mode === "failing") {
      return Promise.reject(new Error("denied"));
    }
    return Promise.resolve();
  });
  const writeText = vi.fn((text: string) => {
    if (mode === "failing") {
      return Promise.reject(new Error("denied"));
    }
    expect(text).toContain("# Deploy");
    return Promise.resolve();
  });
  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    clipboard: { write, writeText },
  });
  return { write, writeText };
}

test("copy succeeds through ClipboardItem and announces it politely", async () => {
  const { write } = stubClipboard("item");
  vi.stubGlobal("ClipboardItem", makeClipboardItemClass());
  const fetch = vi.fn(
    async () =>
      new Response("# Deploy\n", {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      })
  );
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("ClipboardItem", makeClipboardItemClass());

  render(<DocsPageActions mdPath={mdPath} mdUrl={mdUrl} />);
  const button = screen.getByRole("button", {
    name: "Copy page as Markdown",
  });

  fireEvent.click(button);

  expect(fetch).toHaveBeenCalledWith(mdPath);
  await waitFor(() => expect(write).toHaveBeenCalled());
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Copy page as Markdown" }).textContent
    ).toContain("Copied")
  );
  expect(screen.getByRole("status").textContent).toBe(
    "Copied page as Markdown."
  );
  // No fallback link when the copy worked.
  expect(
    screen.queryByRole("link", {
      name: "Open the Markdown page",
    })
  ).toBeNull();
});

test("copy falls back to writeText when ClipboardItem is missing", async () => {
  const { write, writeText } = stubClipboard("text-only");
  vi.stubGlobal("ClipboardItem", undefined);
  const fetch = vi.fn(
    async () =>
      new Response("# Deploy\n", {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      })
  );
  vi.stubGlobal("fetch", fetch);

  render(<DocsPageActions mdPath={mdPath} mdUrl={mdUrl} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copy page as Markdown" })
  );

  expect(write).not.toHaveBeenCalled();
  await waitFor(() => expect(writeText).toHaveBeenCalled());
  expect(screen.getByRole("status").textContent).toBe(
    "Copied page as Markdown."
  );
});

test("copy failure announces the alternative and links the markdown page", async () => {
  stubClipboard("failing");
  const fetch = vi.fn(async () => new Response("# Deploy\n"));
  vi.stubGlobal("fetch", fetch);

  render(<DocsPageActions mdPath={mdPath} mdUrl={mdUrl} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copy page as Markdown" })
  );

  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe(
      "Could not copy. Open the Markdown page instead."
    )
  );
  const fallback = screen.getByRole("link", {
    name: "Open the Markdown page",
  }) as HTMLAnchorElement;
  expect(fallback.getAttribute("href")).toBe(mdPath);
});

test("copy failure on the fetch shows the same fallback", async () => {
  stubClipboard("text-only");
  vi.stubGlobal("ClipboardItem", undefined);
  const fetch = vi.fn(async () => new Response("nope", { status: 404 }));
  vi.stubGlobal("fetch", fetch);

  render(<DocsPageActions mdPath={mdPath} mdUrl={mdUrl} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Copy page as Markdown" })
  );

  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toBe(
      "Could not copy. Open the Markdown page instead."
    )
  );
  expect(
    screen.getByRole("link", {
      name: "Open the Markdown page",
    })
  ).toBeTruthy();
});
