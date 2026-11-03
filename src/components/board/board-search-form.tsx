import { SearchIcon } from "lucide-react";

import { BOARD_SEARCH_PATH } from "@/lib/board/paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  serializeBoardQuery,
} from "@/lib/board/query";

function hiddenFields(
  query: BoardQuery,
  options: BoardQueryOptions
): { name: string; value: string }[] {
  const params = serializeBoardQuery({ ...query, page: 1, q: "" }, options);
  const fields: { name: string; value: string }[] = [];

  for (const [name, value] of params.entries()) {
    fields.push({ name, value });
  }

  return fields;
}

export function searchPlaceholder(count?: number): string {
  if (count === undefined || count <= 0) {
    return "Search jobs";
  }
  return count === 1 ? "Search 1 job" : `Search ${count} jobs`;
}

// The search icon is the submit button, so Enter and a tap both search.
export function BoardSearchForm({
  count,
  options,
  query,
}: {
  count?: number;
  options: BoardQueryOptions;
  query: BoardQuery;
}) {
  return (
    <form
      action={BOARD_SEARCH_PATH}
      className="bg-card ring-line-strong focus-within:ring-ring/40 relative flex h-10 w-full items-center rounded-[10px] ring-1 ring-inset lg:h-7 lg:rounded-[6px]"
      data-testid="board-search"
      method="get"
    >
      <button
        aria-label="Search"
        className="text-subtle hover:text-foreground flex h-full w-10 shrink-0 items-center justify-center rounded-l-[10px] lg:w-8 lg:rounded-l-[6px]"
        data-testid="board-search-submit"
        type="submit"
      >
        <SearchIcon aria-hidden="true" className="size-4 lg:size-3.5" />
      </button>
      <label className="sr-only" htmlFor="board-search-input">
        Search jobs by title or company
      </label>
      <input
        className="text-foreground placeholder:text-subtle h-full min-w-0 flex-1 bg-transparent pr-3 text-[15px] outline-none lg:text-[13px] [&::-webkit-search-cancel-button]:hidden"
        data-testid="board-search-input"
        defaultValue={query.q}
        id="board-search-input"
        name="q"
        placeholder={searchPlaceholder(count)}
        type="search"
      />
      {hiddenFields(query, options).map((field) => (
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
