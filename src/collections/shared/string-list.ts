import type { ArrayField } from "payload";

export function stringListField(name: string, label: string): ArrayField {
  return {
    fields: [{ name: "value", required: true, type: "text" }],
    label,
    name,
    type: "array",
  };
}
