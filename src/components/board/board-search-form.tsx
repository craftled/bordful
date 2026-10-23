import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function BoardSearchForm({
  options,
  query,
}: {
  options: BoardQueryOptions;
  query: BoardQuery;
}) {
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
      <Input
        data-testid="board-search-input"
        defaultValue={query.q}
        id="board-search-input"
        name="q"
        placeholder="Search title or company"
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
      <Button data-testid="board-search-submit" type="submit">
        Search
      </Button>
    </form>
  );
}
