import type { CSSProperties, ReactNode } from "react";

export interface BaseLayoutProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export interface HeaderProps extends BaseLayoutProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

export interface SidebarProps extends BaseLayoutProps {
  collapsed?: boolean;
  onToggle?: () => void;
  items?: Array<{
    key: string;
    label: ReactNode;
    icon?: ReactNode;
    children?: Array<{
      key: string;
      label: ReactNode;
      icon?: ReactNode;
    }>;
  }>;
}

export interface FooterProps extends BaseLayoutProps {
  copyright?: ReactNode;
}

export interface BreadcrumbProps extends BaseLayoutProps {
  items?: Array<{ title: ReactNode; href?: string }>;
}

export interface MainLayoutProps extends BaseLayoutProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  breadcrumb?: ReactNode;
}
