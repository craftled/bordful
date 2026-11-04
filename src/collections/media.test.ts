import { beforeEach, expect, test, vi } from "vitest";

const revalidated = vi.hoisted(() => ({ tags: [] as string[] }));

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string) => {
    revalidated.tags.push(tag);
  },
}));

const { Media } = await import("./media");

const doc = { alt: "Logo", filename: "logo.png", id: 1 };

beforeEach(() => {
  revalidated.tags = [];
});

test("replacing a media file refreshes the cached site settings logo", async () => {
  const [hook] = Media.hooks?.afterChange ?? [];
  await hook?.({ doc, operation: "update", previousDoc: doc } as never);
  expect(revalidated.tags).toEqual(["site-settings"]);
});

test("deleting a media file refreshes the cached site settings logo", async () => {
  const [hook] = Media.hooks?.afterDelete ?? [];
  await hook?.({ doc, id: doc.id } as never);
  expect(revalidated.tags).toEqual(["site-settings"]);
});
