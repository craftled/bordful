import { SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOARD_SEARCH_PATH } from "@/lib/board/paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  serializeBoardQuery,
} from "@/lib/board/query";
import { cn } from "@/lib/utils";

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

export function BoardSearchForm({
  options,
  query,
  variant = "default",
}: {
  options: BoardQueryOptions;
  query: BoardQuery;
  variant?: "default" | "hero";
}) {
  const hero = variant === "hero";

  return (
    <form
      action={BOARD_SEARCH_PATH}
      className="flex flex-col gap-2 sm:flex-row"
      data-testid="board-search"
      method="get"
    >
      <label className="sr-only" htmlFor="board-search-input">
        Search jobs
      </label>
      <div className="relative min-w-0 flex-1">
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          className={cn(
            "pl-9",
            hero && "h-11 border-white bg-white text-zinc-900"
          )}
          data-testid="board-search-input"
          defaultValue={query.q}
          id="board-search-input"
          name="q"
          placeholder="Search title or company"
          type="search"
        />
      </div>
      {hiddenFields(query, options).map((field) => (
        <input
          key={field.name}
          name={field.name}
          type="hidden"
          value={field.value}
        />
      ))}
      <Button
        className={cn(hero && "h-11 bg-white text-primary hover:bg-zinc-100")}
        data-testid="board-search-submit"
        type="submit"
      >
        Search
      </Button>
    </form>
  );
}
