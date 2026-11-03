import type { FieldHook } from "payload";

export const emptyToNull: FieldHook = ({ value }) => {
  if (value === "") {
    return null;
  }

  return value;
};
