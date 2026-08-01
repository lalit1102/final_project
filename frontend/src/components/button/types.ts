import type { ButtonProps, TooltipProps } from "antd";
import type { ReactNode } from "react";

export type ButtonVariant = "solid" | "outlined" | "dashed" | "text" | "link";
export type ButtonIconPosition = "start" | "end";

export interface BaseButtonProps extends Omit<ButtonProps, "icon" | "children" | "danger"> {
  children?: ReactNode;
  icon?: ReactNode;
  iconPosition?: ButtonIconPosition;
  loading?: boolean;
  loadingText?: ReactNode;
  spinner?: ReactNode;
  fullWidth?: boolean;
  responsiveWidth?: boolean;
  permission?: string | string[];
  onAnalytics?: (event: string) => void;
  tooltip?: ReactNode | TooltipProps;
  variant?: ButtonVariant;
  htmlType?: "button" | "submit" | "reset";
}

export interface LoadingButtonProps extends BaseButtonProps {
  loading?: boolean;
}

export interface LinkButtonProps extends Omit<BaseButtonProps, "href"> {
  href?: string;
  target?: string;
}

export interface IconButtonProps extends Omit<BaseButtonProps, "children"> {
  icon: ReactNode;
  label?: string;
}

export interface ConfirmButtonProps extends BaseButtonProps {
  title?: ReactNode;
  description?: ReactNode;
  okText?: ReactNode;
  cancelText?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ButtonGroupProps {
  children: ReactNode;
  size?: BaseButtonProps["size"];
  className?: string;
  style?: React.CSSProperties;
}
