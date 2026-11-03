export function toOptions<T extends string>(
  values: readonly T[],
  labels?: Partial<Record<T, string>>
): { label: string; value: T }[] {
  return values.map((value) => ({
    label: labels?.[value] ?? value,
    value,
  }));
}
