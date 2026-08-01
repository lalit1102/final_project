"use client";

import { Form as AntForm } from "antd";
import { Controller, type FieldPath, type FieldValues, useFormContext } from "react-hook-form";
import { useFieldError } from "./hooks";
import type { FormItemProps } from "./types";

export default function FormItem<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  render,
  rules,
  shouldUnregister,
  required,
  tooltip,
  help,
  extra,
  hidden,
  preserve,
  className,
  style,
  disabled,
  size,
  status,
  allowClear,
  placeholder,
  loading,
  autoFocus,
  id,
  labelAlign,
  colon = true,
  dependencies,
}: FormItemProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const { error, hasError } = useFieldError<TFieldValues, TName>(name);

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      shouldUnregister={shouldUnregister}
      render={({ field, fieldState, formState }) => (
        <AntForm.Item
          className={className}
          style={style}
          label={label}
          name={name}
          required={required}
          tooltip={tooltip}
          help={fieldState.error?.message ?? help}
          extra={extra}
          hidden={hidden}
          preserve={preserve}
          labelAlign={labelAlign}
          colon={colon}
          dependencies={dependencies}
          validateStatus={fieldState.error ? "error" : undefined}
          status={hasError ? "error" : status}
        >
          {render(field, fieldState, formState)}
        </AntForm.Item>
      )}
    />
  );
}