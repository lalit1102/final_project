import type { ComponentProps, CSSProperties, ReactNode } from "react";
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  FormState,
  RegisterOptions,
} from "react-hook-form";
import {
  AutoComplete,
  Button,
  Cascader,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  Radio,
  Select,
  Switch,
  TimePicker,
  TreeSelect,
  Upload,
} from "antd";

export type FormFieldSize = "small" | "middle" | "large";
export type FormFieldStatus = "error" | "warning" | "success" | "validating";
export type FormLabelAlign = "left" | "right";

export interface CommonFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  label?: ReactNode;
  required?: boolean;
  tooltip?: ReactNode;
  help?: ReactNode;
  extra?: ReactNode;
  hidden?: boolean;
  preserve?: boolean;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  size?: FormFieldSize;
  status?: FormFieldStatus;
  allowClear?: boolean;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  id?: string;
  labelAlign?: FormLabelAlign;
  rules?: RegisterOptions<TFieldValues, TName>;
  shouldUnregister?: boolean;
}

export interface FormItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends CommonFieldProps<TFieldValues, TName> {
  render: (
    field: ControllerRenderProps<TFieldValues, TName>,
    fieldState: ControllerFieldState,
    formState: FormState<TFieldValues>,
  ) => ReactNode;
}

export type FormInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Input>, "name">;

export type FormTextAreaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Input.TextArea>, "name">;

export type FormInputNumberProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof InputNumber>, "name">;

export type FormSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Select>, "name">;

export type FormCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Checkbox>, "name" | "checked">;

export type FormCheckboxGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Checkbox.Group>, "name">;

export type FormRadioProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Radio>, "name" | "checked">;

export type FormRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Radio.Group>, "name">;

export type FormSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Switch>, "name" | "checked">;

export type FormDatePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof DatePicker>, "name">;

export type FormRangePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof DatePicker.RangePicker>, "name">;

export type FormTimePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof TimePicker>, "name">;

export type FormUploadProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Upload>, "name" | "fileList">;

export type FormAutoCompleteProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof AutoComplete>, "name">;

export type FormTreeSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof TreeSelect>, "name">;

export type FormCascaderProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Cascader>, "name">;

export type FormOTPProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> & Omit<ComponentProps<typeof Input.OTP>, "name">;

export type FormButtonProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = CommonFieldProps<TFieldValues, TName> &
  Omit<ComponentProps<typeof Button>, "name">;

export interface FormHiddenProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends CommonFieldProps<TFieldValues, TName> {
  value?: unknown;
}
