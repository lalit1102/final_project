"use client";

import { Checkbox } from "antd";
import { type FieldPath, type FieldValues } from "react-hook-form";
import FormItem from "./FormItem";
import { useFormField } from "./hooks";
import type { FormCheckboxProps } from "./types";

export default function FormCheckbox<
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
  children,
  ...rest
}: FormCheckboxProps<TFieldValues, TName>) {
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
        const { value, onChange: handleValueChange, onBlur: handleBlur } = useFormField<TFieldValues, TName, boolean>(field);

        return (
          <Checkbox
            {...rest}
            id={id}
            disabled={disabled}
            className={className}
            style={style}
            checked={Boolean(value)}
            onChange={(event) => {
              handleValueChange(event.target.checked);
              onChange?.(event);
            }}
            onBlur={() => handleBlur()}
          >
            {children ?? label}
          </Checkbox>
        );
      }}
    />
  );
}