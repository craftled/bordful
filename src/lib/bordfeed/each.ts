// Payload calls run one after another: sync writes must not race, and a
// page loop needs the previous page's count.

export async function eachDoc<T extends { id: number }>(
  load: (page: number) => Promise<{ docs: T[]; totalPages: number }>,
  page = 1,
  totalPages = 1,
  docs: T[] = []
): Promise<T[]> {
  if (page > totalPages) {
    return docs;
  }

  const result = await load(page);
  return eachDoc(
    load,
    page + 1,
    result.totalPages || 1,
    docs.concat(result.docs)
  );
}

export async function eachSerial<T>(
  items: readonly T[],
  visit: (item: T) => Promise<void>
): Promise<void> {
  const [head, ...rest] = items;
  if (head === undefined) {
    return;
  }

  await visit(head);
  await eachSerial(rest, visit);
}
