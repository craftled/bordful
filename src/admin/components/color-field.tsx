"use client";

import {
  FieldError,
  FieldLabel,
  fieldBaseClass,
  useField,
  useFormFields,
} from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import { type ChangeEvent, useCallback } from "react";

import { pairedColorKey } from "@/theme/contrast";

import {
  colorFieldKey,
  colorFieldLabel,
  colorFieldModel,
  pairedFieldPath,
} from "./color-field-model";

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function ColorField({ field, path, readOnly }: TextFieldClientProps) {
  const { setValue, showError, value } = useField<string>({
    potentiallyStalePath: path,
  });
  const key = colorFieldKey(path);
  const label = colorFieldLabel(key, field.label);
  const textValue = stringValue(value);
  const pair = pairedColorKey(key);
  const pairedValue = useFormFields(([fields]) => {
    if (pair === null) {
      return "";
    }

    return stringValue(fields[pairedFieldPath(path, pair)]?.value);
  });
  const model = colorFieldModel(textValue, pairedValue, key);
  const inputId = `color-field-${key}-input`;
  const onTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    [setValue]
  );
  const onSwatchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
    },
    [setValue]
  );
  const onReset = useCallback(() => {
    setValue("");
  }, [setValue]);

  return (
    <div
      className={`${fieldBaseClass} text`}
      data-testid={`color-field-${key}`}
    >
      <FieldLabel
        htmlFor={inputId}
        label={label}
        path={path}
        required={field.required}
      />
      <div className={`${fieldBaseClass}__wrap`}>
        <FieldError path={path} showError={showError} />
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "var(--spacer-2, 0.5rem)",
          }}
        >
          <input
            autoCapitalize="off"
            autoComplete="off"
            data-testid={inputId}
            disabled={Boolean(readOnly)}
            id={inputId}
            onChange={onTextChange}
            placeholder={model.swatch}
            spellCheck={false}
            type="text"
            value={textValue}
          />
          <input
            aria-label={`${label} swatch`}
            disabled={Boolean(readOnly)}
            onChange={onSwatchChange}
            type="color"
            value={model.swatch}
          />
          <button disabled={Boolean(readOnly)} onClick={onReset} type="button">
            Reset to default
          </button>
        </div>
        {model.ratio === null ? null : (
          <p>
            {`${model.ratio}:1`}
            {model.lowContrast ? " Low contrast" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
