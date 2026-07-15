"use client";

import { TreeSelect } from "antd";
import type { FieldPath } from "react-hook-form";
import { DEFAULT_FORM_SIZE, DEFAULT_PLACEHOLDER } from "./constants";
import FormItem from "./FormItem";
import type { FormTreeSelectProps } from "./types";

export default function FormTreeSelect<
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
  size = DEFAULT_FORM_SIZE,
  status,
  placeholder = DEFAULT_PLACEHOLDER,
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
  onChange,
  ...rest
}: FormTreeSelectProps<TFieldValues, TName>) {
  return (
    <FormItem
      name={name}
      label={label}
      rules={rules}
      shouldUnregister={shouldUnregister}
      required={required}
      tooltip={tooltip}
      help={help}
      extra={extra}
      labelAlign={labelAlign}
      hidden={hidden}
      preserve={preserve}
      className={className}
      style={style}
      disabled={disabled}
      size={size}
      status={status}
      allowClear={allowClear}
      placeholder={placeholder}
      loading={loading}
      autoFocus={autoFocus}
      id={id}
      render={(field) => (
        <TreeSelect
          {...rest}
          id={id}
          disabled={disabled}
          loading={loading}
          placeholder={placeholder}
          allowClear={allowClear}
          value={field.value as unknown}
          onChange={(nextValue, label, extra) => {
            field.onChange(nextValue);
            onChange?.(nextValue, label, extra);
          }}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
