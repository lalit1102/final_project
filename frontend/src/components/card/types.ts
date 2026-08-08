import type { CardProps, SkeletonProps } from "antd";
import type { ReactNode } from "react";

export type CardVariant = "outlined" | "borderless";

export interface BaseCardProps extends Omit<CardProps, "children" | "title" | "extra" | "variant" | "role" | "content"> {
  children?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  actions?: ReactNode[];
  loading?: boolean;
  skeleton?: boolean;
  skeletonProps?: SkeletonProps;
  variant?: CardVariant;
  fullWidth?: boolean;
  responsive?: boolean;
  role?: ReactNode;
  content?: ReactNode;
}

export interface StatsCardProps extends BaseCardProps {
  value?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

export interface ProfileCardProps extends BaseCardProps {
  avatar?: ReactNode;
  name?: ReactNode;
  meta?: ReactNode;
}

export interface InfoCardProps extends BaseCardProps {
  label?: ReactNode;
}

export interface EmptyCardProps extends BaseCardProps {
  emptyText?: ReactNode;
}

export interface CardHeaderProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  extra?: ReactNode;
  actions?: ReactNode[];
  className?: string;
  style?: React.CSSProperties;
}

export interface CardFooterProps {
  children?: ReactNode;
  actions?: ReactNode[];
  className?: string;
  style?: React.CSSProperties;
}
