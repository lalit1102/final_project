import type { ReactNode } from "react";

export interface BaseFeedbackProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface LoaderProps extends BaseFeedbackProps {
  text?: ReactNode;
  size?: "small" | "default" | "large";
}

export interface SpinnerProps extends BaseFeedbackProps {
  text?: ReactNode;
  size?: "small" | "default" | "large";
}

export interface EmptyProps extends BaseFeedbackProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

export interface ErrorProps extends BaseFeedbackProps {
  title?: ReactNode;
  description?: ReactNode;
  retry?: ReactNode;
}

export interface ResultProps extends BaseFeedbackProps {
  title?: ReactNode;
  description?: ReactNode;
  extra?: ReactNode;
  status?: "success" | "error" | "info" | "404" | "403" | "500";
}

export interface SkeletonProps extends BaseFeedbackProps {
  active?: boolean;
  paragraph?: boolean;
  title?: boolean;
  avatar?: boolean;
}
