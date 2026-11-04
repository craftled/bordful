import { SearchIcon } from "lucide-react";

import { BOARD_SEARCH_PATH } from "@/lib/board/paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  serializeBoardQuery,
} from "@/lib/board/query";

export const BOARD_SEARCH_INPUT_ID = "board-search-input";

export interface SearchField {
  name: string;
  value: string;
}

// The filters a search keeps, minus the text and the page.
export function searchHiddenFields(
  query: BoardQuery,
  options: BoardQueryOptions
): SearchField[] {
  const params = serializeBoardQuery({ ...query, page: 1, q: "" }, options);
  const fields: SearchField[] = [];

  for (const [name, value] of params.entries()) {
    fields.push({ name, value });
  }

  return fields;
}

// Search matches title, company, location, summary and skills, so the long
// form can say what Paper says.
export function searchPlaceholder(count?: number, long = false): string {
  const suffix = long ? " by role, company or skill" : "";
  if (count === undefined || count <= 0) {
    return `Search jobs${suffix}`;
  }
  return count === 1
    ? `Search 1 job${suffix}`
    : `Search ${count} jobs${suffix}`;
}

// Rendered once per page, in the site header. The search icon is the submit
// button, so Enter and a tap both search. On phones it is a full-width row
// under the brand bar; from lg up it sits in the bar with the ⌘K hint.
export function BoardSearchForm({
  count,
  hidden = [],
  q = "",
}: {
  count?: number;
  hidden?: SearchField[];
  q?: string;
}) {
  return (
    <form
      action={BOARD_SEARCH_PATH}
      className="bg-card ring-line-strong focus-within:ring-ring/40 relative flex h-10 w-full items-center rounded-[10px] ring-1 ring-inset lg:h-8 lg:rounded-[8px]"
      data-testid="board-search"
      method="get"
    >
      <button
        aria-label="Search"
        className="text-subtle hover:text-foreground flex h-full w-10 shrink-0 items-center justify-center rounded-l-[10px] lg:w-8 lg:rounded-l-[8px]"
        data-testid="board-search-submit"
        type="submit"
      >
        <SearchIcon aria-hidden="true" className="size-4 lg:size-3.5" />
      </button>
      <label className="sr-only" htmlFor={BOARD_SEARCH_INPUT_ID}>
        Search jobs by title or company
      </label>
      <input
        className="text-foreground placeholder:text-subtle peer h-full min-w-0 flex-1 bg-transparent pr-3 text-[15px] outline-none lg:pr-2 lg:text-[14px] lg:placeholder:text-transparent [&::-webkit-search-cancel-button]:hidden"
        data-testid="board-search-input"
        defaultValue={q}
        id={BOARD_SEARCH_INPUT_ID}
        name="q"
        placeholder={searchPlaceholder(count)}
        type="search"
      />
      {/* Paper: the short count on phones, the long hint in the desktop bar.
          A placeholder can't change per breakpoint, so from lg up the native
          one goes transparent and this copy shows while the field is empty. */}
      <span
        aria-hidden="true"
        className="text-subtle pointer-events-none absolute inset-y-0 right-12 left-8 hidden items-center truncate text-[14px] leading-5 lg:peer-placeholder-shown:flex"
      >
        {searchPlaceholder(count, true)}
      </span>
      <span
        aria-hidden="true"
        className="bg-tag text-subtle mr-2.5 hidden shrink-0 rounded-[4px] px-[5px] font-sans text-[10px] leading-4 peer-focus:invisible lg:inline-block"
      >
        ⌘K
      </span>
      {hidden.map((field) => (
        <input
          key={field.name}
          name={field.name}
          type="hidden"
          value={field.value}
        />
      ))}
    </form>
  );
}
