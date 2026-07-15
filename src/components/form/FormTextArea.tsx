"use client";

import { Input } from "antd";
import { type FieldPath, type FieldValues } from "react-hook-form";
import { DEFAULT_FORM_SIZE, DEFAULT_PLACEHOLDER, DEFAULT_TEXTAREA_ROWS } from "./constants";
import FormItem from "./FormItem";
import { useFormField } from "./hooks";
import type { FormTextAreaProps } from "./types";

export default function FormTextArea<
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
  rows = DEFAULT_TEXTAREA_ROWS,
  loading,
  autoFocus,
  id,
  labelAlign,
  ...rest
}: FormTextAreaProps<TFieldValues, TName>) {
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
        const { value, onChange: handleValueChange, onBlur: handleBlur } = useFormField<TFieldValues, TName, string>(field);

        return (
          <Input.TextArea
            {...rest}
            id={id}
            disabled={disabled}
            size={size}
            status={status}
            placeholder={placeholder}
            allowClear={allowClear}
            autoFocus={autoFocus}
            rows={rows}
            value={value ?? ""}
            onChange={(event) => handleValueChange(event.target.value)}
            onBlur={() => handleBlur()}
          />
        );
      }}
    />
  );
}