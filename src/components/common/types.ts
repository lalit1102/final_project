import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import type { DividerProps as AntDividerProps, BadgeProps as AntBadgeProps } from 'antd';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'default';

export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
}

export interface PageContainerProps extends BaseComponentProps, HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  extra?: ReactNode;
}

export interface PageTitleProps extends BaseComponentProps {
  title: ReactNode;
  subtitle?: ReactNode;
  description?: ReactNode;
  status?: StatusType;
  extra?: ReactNode;
}

export interface SectionProps extends BaseComponentProps {
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  divider?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  extra?: ReactNode;
  padding?: 'none' | 'small' | 'middle' | 'large';
}

export interface DividerProps extends BaseComponentProps, Omit<AntDividerProps, 'className' | 'style'> {
  // Enhancing Ant Design's Divider with strictly typed extensions if needed
}

export interface StatusTagProps extends BaseComponentProps {
  status: StatusType;
  text?: ReactNode;
  icon?: ReactNode;
  dynamicColor?: string; // Optional hex for custom mapping
}

export interface NoDataProps extends BaseComponentProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  illustration?: ReactNode;
  actionText?: string;
  onRetry?: () => void;
}

export interface CopyButtonProps extends BaseComponentProps {
  textToCopy: string;
  label?: string;
  successFeedback?: string;
  errorFeedback?: string;
  customIcon?: ReactNode;
}

export interface BadgeProps extends BaseComponentProps, Omit<AntBadgeProps, 'className' | 'style'> {
  status?: AntBadgeProps['status'];
}

export interface TooltipTextProps extends BaseComponentProps {
  text: string;
  maxLength?: number;
  copyable?: boolean;
  tooltipText?: ReactNode;
}
