import type { CSSProperties, ReactNode } from "react";

export interface BaseLayoutProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
