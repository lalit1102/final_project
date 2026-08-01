"use client";

import { useCallback, useMemo } from "react";
import { type FieldPath, type FieldValues } from "react-hook-form";
import { normalizeValue } from "../helpers";

export function useControlledValue<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TValue,
>(value: TValue | undefined, onChange: (value: TValue) => void) {
  const normalizedValue = useMemo(() => normalizeValue(value), [value]);

  const handleChange = useCallback(
    (nextValue: TValue) => {
      onChange(normalizeValue(nextValue) as TValue);
    },
    [onChange],
  );

  return {
    value: normalizedValue,
    onChange: handleChange,
  };
}
