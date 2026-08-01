import type { DrawerProps } from "antd";
import type { ReactNode } from "react";

export interface BaseDrawerProps extends Omit<DrawerProps, "children" | "title"> {
  children?: ReactNode;
  title?: ReactNode;
  loading?: boolean;
  width?: number | string;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

export interface FormDrawerProps extends BaseDrawerProps {
  form?: ReactNode;
}

export interface DetailDrawerProps extends BaseDrawerProps {
  details?: ReactNode;
}
