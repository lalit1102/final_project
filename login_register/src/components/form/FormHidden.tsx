"use client";

import { useEffect } from "react";
import { useFormContext, type FieldPath, type FieldValues } from "react-hook-form";
import type { FormHiddenProps } from "./types";

export default function FormHidden<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, value }: FormHiddenProps<TFieldValues, TName>) {
  const { setValue } = useFormContext<TFieldValues>();

  useEffect(() => {
    setValue(name, value as TFieldValues[typeof name], {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [name, setValue, value]);

  return null;
}
