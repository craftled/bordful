export function relationId(value: unknown): number | string | null {
  if (typeof value === "number" || typeof value === "string") {
    return value;
  }

  if (value !== null && typeof value === "object" && "id" in value) {
    const { id } = value;
    if (typeof id === "number" || typeof id === "string") {
      return id;
    }
  }

  return null;
}
