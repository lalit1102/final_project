"use client";

import { DatePicker } from "antd";
import { type FieldPath, type FieldValues } from "react-hook-form";
import { DEFAULT_DATE_FORMAT, DEFAULT_FORM_SIZE, DEFAULT_PLACEHOLDER } from "./constants";
import FormItem from "./FormItem";
import { useFormField } from "./hooks";
import type { FormDatePickerProps } from "./types";

export default function FormDatePicker<
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
  format = DEFAULT_DATE_FORMAT,
  loading,
  autoFocus,
  id,
  labelAlign,
  onChange,
  ...rest
}: FormDatePickerProps<TFieldValues, TName>) {
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
        const { value, onChange: handleValueChange, onBlur: handleBlur } = useFormField<TFieldValues, TName, unknown>(field);

        return (
          <DatePicker
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
            style={{ width: "100%", ...style }}
            format={format}
            value={value as typeof rest.value}
            onChange={(nextValue, dateString) => {
              handleValueChange(nextValue as unknown);
              onChange?.(nextValue, dateString);
            }}
            onBlur={() => handleBlur()}
          />
        );
      }}
    />
  );
}