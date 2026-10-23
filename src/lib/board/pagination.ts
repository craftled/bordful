export type PageSlot = number | "gap";

const FULL_LIST_MAX = 7;

// Page 1 and the last page are always linked, the current page has a neighbour
// on each side. A single hidden page between two slots is shown instead of a
// gap, since "…" for one page saves nothing.
export function pageSlots(page: number, totalPages: number): PageSlot[] {
  if (totalPages <= FULL_LIST_MAX) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const kept = [...new Set([1, totalPages, page - 1, page, page + 1])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((left, right) => left - right);

  const slots: PageSlot[] = [];
  for (const value of kept) {
    const previous = slots.at(-1);
    if (typeof previous === "number") {
      if (value - previous === 2) {
        slots.push(previous + 1);
      } else if (value - previous > 2) {
        slots.push("gap");
      }
    }
    slots.push(value);
  }

  return slots;
}
