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
| `job-card-extra` | Extra content on a job card. |

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
