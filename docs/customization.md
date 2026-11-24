# Customization

Upstream does not edit these three places after a release:

1. Admin settings (Site settings). See [Configuration](configuration.md) and [Theming](theming.md).
2. `bordful.config.ts`. See [Configuration](configuration.md).
3. `src/custom/**`.

Everything else may change in an upstream release. Keep your edits inside these three so `git merge` stays small. See [Upgrading](../UPGRADING.md).

## Slot registry

`src/custom/index.ts` exports `customSlots`. Slots:

| Slot | When it renders |
| --- | --- |
| `header` | Replaces the default site header. |
| `footer` | Replaces the default site footer. |
| `job-card-extra` | Extra content on a job card. It renders above the card link, so its own links and buttons stay clickable. |

A missing slot keeps the default UI. Minimal registration:

```tsx
import type { ComponentType } from "react";

import type { SlotId } from "@/config/slots";

function ExampleJobNote() {
  return <p>From Example Board</p>;
}

export const customSlots: Partial<Record<SlotId, ComponentType>> = {
  "job-card-extra": ExampleJobNote,
};
```

Do not add dependencies for a slot. Use the components already in the repo, or plain elements.

## Agent-readable pages

bordful.com serves its public pages for AI agents as well as browsers. A board with `BORDFUL_MARKETING=false` is unchanged.

- `/llms.txt` lists every public page as its markdown URL: the docs, the marketing pages and the board index pages. No job posting URL is listed.
- `/llms-full.txt` serves every docs page in one file, each behind a `Source` line.
- Every docs, marketing and board index page has a markdown version at its own URL plus `.md` (`/index.md` for the home page), and returns markdown when a request sends `Accept: text/markdown`. The markdown is generated from the same data modules the pages render, so the two cannot drift.
- Docs pages carry Copy as Markdown, Open in ChatGPT and Open in Claude actions, built from the page's absolute markdown URL.
