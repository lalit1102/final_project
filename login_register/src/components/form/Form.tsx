"use client";

import { Form as AntForm } from "antd";
import type { CSSProperties, FormHTMLAttributes, ReactNode } from "react";
import {
  type FieldValues,
  FormProvider,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

interface FormProps<TFieldValues extends FieldValues> extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  methods: UseFormReturn<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function Form<TFieldValues extends FieldValues>({
  methods,
  onSubmit,
  children,
  className,
  ...rest
}: FormProps<TFieldValues>) {
  return (
    <FormProvider {...methods}>
      <form className={className} onSubmit={methods.handleSubmit(onSubmit)} {...rest}>
        <AntForm component={false}>
          {children}
        </AntForm>
      </form>
    </FormProvider>
  );
}