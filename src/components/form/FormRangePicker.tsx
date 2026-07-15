"use client";

import { DatePicker } from "antd";
import { type FieldPath, type FieldValues } from "react-hook-form";
import FormItem from "./FormItem";
import type { FormRangePickerProps } from "./types";

const { RangePicker } = DatePicker;

export default function FormRangePicker<
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
  size,
  status,
  allowClear,
  placeholder,
  loading,
  autoFocus,
  id,
  labelAlign,
  onChange,
  ...rest
}: FormRangePickerProps<TFieldValues, TName>) {
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
      render={(field) => (
        <RangePicker
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
          value={field.value as typeof rest.value}
          onChange={(nextValue, dateString) => {
            field.onChange(nextValue);
            onChange?.(nextValue, dateString);
          }}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}