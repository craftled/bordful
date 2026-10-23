import type {
  SelectFieldSingleValidation,
  TextFieldSingleValidation,
} from "payload";

const ISO2 = /^[A-Z]{2}$/;
const ISO4217 = /^[A-Z]{3}$/;
const HOSTNAME = /^[a-z0-9.-]+\.[a-z]{2,}$/;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function isBlank(
  value: string | null | undefined
): value is "" | null | undefined {
  return value === null || value === undefined || value === "";
}

export const httpUrl: TextFieldSingleValidation = (value) => {
  if (isBlank(value)) {
    return true;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return true;
    }
  } catch {
    return "Enter an http or https URL.";
  }

  return "Enter an http or https URL.";
};

export const iso2: TextFieldSingleValidation = (value) => {
  if (isBlank(value)) {
    return true;
  }

  return ISO2.test(value) ? true : "Enter a two-letter country code.";
};

export const iso4217: TextFieldSingleValidation = (value) => {
  if (isBlank(value)) {
    return true;
  }

  return ISO4217.test(value) ? true : "Enter a three-letter currency code.";
};

export const hostname: TextFieldSingleValidation = (value) => {
  if (isBlank(value)) {
    return true;
  }

  return HOSTNAME.test(value) ? true : "Enter a lowercase hostname.";
};

export const hexColor: TextFieldSingleValidation = (value) => {
  if (isBlank(value)) {
    return true;
  }

  return HEX_COLOR.test(value) ? true : "Enter a color as #rrggbb.";
};

export const syncOriginValidate: SelectFieldSingleValidation = (
  value,
  { operation, previousValue, req }
) => {
  const isSyncOrigin = value === "bordfeed" || value === "bordfeed_sample";
  const settingOrigin = operation === "create" || value !== previousValue;

  if (req.user && isSyncOrigin && settingOrigin) {
    return "Only the Bordfeed sync can set this origin.";
  }

  return true;
};
