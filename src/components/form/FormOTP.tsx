"use client";

import { Input } from "antd";
import type { FieldPath } from "react-hook-form";
import { DEFAULT_FORM_SIZE } from "./constants";
import FormItem from "./FormItem";
import { useFormField } from "./hooks";
import type { FormOTPProps } from "./types";

export default function FormOTP<
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
  onChange,
  ...rest
}: FormOTPProps<TFieldValues, TName>) {
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
      render={(field) => {
        const { value, onChange: handleValueChange, onBlur: handleBlur } = useFormField<TFieldValues, TName, string>(field);

        return (
          <Input.OTP
            {...rest}
            id={id}
            disabled={disabled}
            autoFocus={autoFocus}
            value={value ?? ""}
            onChange={(nextValue) => {
              handleValueChange(nextValue);
              onChange?.(nextValue);
            }}
            onBlur={() => handleBlur()}
          />
        );
      }}
    />
  );
}
