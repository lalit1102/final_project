"use client";

import { Upload } from "antd";
import { type FieldPath, type FieldValues } from "react-hook-form";
import { DEFAULT_UPLOAD_LIMIT, DEFAULT_UPLOAD_LIST_TYPE } from "./constants";
import FormItem from "./FormItem";
import { useFormField } from "./hooks";
import type { FormUploadProps } from "./types";

export default function FormUpload<
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
  children,
  onChange,
  maxCount = DEFAULT_UPLOAD_LIMIT,
  listType = DEFAULT_UPLOAD_LIST_TYPE,
  ...rest
}: FormUploadProps<TFieldValues, TName>) {
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
        const { value, onChange: handleValueChange, onBlur: handleBlur } = useFormField<TFieldValues, TName, unknown[]>(field);

        return (
          <Upload
            {...rest}
            id={id}
            disabled={disabled}
            className={className}
            style={style}
            listType={listType}
            maxCount={maxCount}
            fileList={value as typeof rest.fileList}
            onChange={(info) => {
              handleValueChange(info.fileList as unknown[]);
              onChange?.(info);
            }}
            onBlur={() => handleBlur()}
          >
            {children}
          </Upload>
        );
      }}
    />
  );
}