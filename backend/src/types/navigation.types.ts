import { PermissionCode } from "./permission.types";

export interface NavigationItem {
  key: string;
  label: string;
  path: string;
  icon: string;
  permission?: PermissionCode;
  children?: NavigationItem[];
  order: number;
  isVisible?: boolean;
}
