"use client";

import { type FieldPath, type FieldValues, useFormContext } from "react-hook-form";

export function useFieldError<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>(name: TName) {
  const { getFieldState } = useFormContext<TFieldValues>();
  const fieldState = getFieldState(name);
  const errorMessage = fieldState.error?.message;

  return {
    error: errorMessage,
    errorMessage,
    hasError: Boolean(errorMessage),
    isTouched: fieldState.isTouched,
    isDirty: fieldState.isDirty,
  };
}
