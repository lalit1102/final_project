"use client";

import { Select } from "antd";
import { type FieldPath, type FieldValues } from "react-hook-form";
import { DEFAULT_FORM_SIZE, DEFAULT_PLACEHOLDER } from "./constants";
import FormItem from "./FormItem";
import { useFormField } from "./hooks";
import type { FormSelectProps } from "./types";

export default function FormSelect<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
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
  size = DEFAULT_FORM_SIZE,
  status,
  allowClear,
  placeholder = DEFAULT_PLACEHOLDER,
  loading,
  autoFocus,
  id,
  labelAlign,
  onChange,
  ...rest
}: FormSelectProps<TFieldValues, TName>) {
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
      labelAlign={labelAlign}
      render={(field) => {
        const { value, onChange: handleValueChange, onBlur: handleBlur } = useFormField<TFieldValues, TName, string | number | Array<string | number> | undefined>(field);

        return (
          <Select
            {...rest}
            id={id}
            disabled={disabled}
            size={size}
            status={status}
            loading={loading}
            placeholder={placeholder}
            allowClear={allowClear}
            autoFocus={autoFocus}
            className={className}
            style={style}
            value={value}
            onChange={(nextValue, option) => {
              handleValueChange(nextValue as string | number | Array<string | number> | undefined);
              onChange?.(nextValue, option);
            }}
            onBlur={() => handleBlur()}
          />
        );
      }}
    />
  );
}