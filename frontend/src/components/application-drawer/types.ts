import type { ReactNode } from "react";

export interface ApplicationItem {
  id: string;
  name: string;
  description?: string;
  icon?: ReactNode;
  href?: string;
  disabled?: boolean;
}

export interface FooterLink {
  label: string;
  href: string;
  target?: "_blank" | "_self";
  rel?: string;
}

export interface ApplicationDrawerLinks {
  helpCenter?: FooterLink;
  privacyPolicy?: FooterLink;
  cookiesPolicy?: FooterLink;
}

export interface ApplicationDrawerProps {
  applications?: ApplicationItem[];
  loading?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  title?: string;
  triggerLabel?: string;
  triggerIcon?: ReactNode;
  logo?: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  onApplicationSelect?: (application: ApplicationItem) => void;
  footerLinks?: ApplicationDrawerLinks;
  emptyText?: string;
}
