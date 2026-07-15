"use client";

import { useCallback, useMemo } from "react";
import type { ControllerRenderProps, FieldPath, FieldValues } from "react-hook-form";
import { normalizeValue } from "../helpers";

export function useFormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TValue,
>(field: ControllerRenderProps<TFieldValues, TName>) {
  const value = useMemo(() => normalizeValue(field.value as TValue | null | undefined), [field.value]);

  const handleValueChange = useCallback(
    (nextValue: TValue) => {
      field.onChange(nextValue);
    },
    [field],
  );

  const handleBlur = useCallback(() => {
    field.onBlur();
  }, [field]);

  return {
    value,
    onChange: handleValueChange,
    onBlur: handleBlur,
    name: field.name,
    ref: field.ref,
  };
}
