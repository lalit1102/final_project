"use client";

import { Button } from "antd";
import type { FieldPath } from "react-hook-form";
import type { FormButtonProps } from "./types";

export default function FormButton<
  TFieldValues extends Record<string, unknown> = Record<string, unknown>,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  rules,
  shouldUnregister,
  className,
  style,
  disabled,
  size,
  status,
  placeholder,
  allowClear,
  loading,
  autoFocus,
  id,
  required,
  tooltip,
  help,
  extra,
  labelAlign,
  hidden,
  preserve,
  children,
  ...rest
}: FormButtonProps<TFieldValues, TName>) {
  return (
    <Button
      {...rest}
      className={className}
      style={style}
      disabled={disabled}
      size={size}
      loading={loading}
      autoFocus={autoFocus}
      id={id}
    >
      {children ?? label}
    </Button>
  );
}
