'use client';

import React from 'react';
import { Menu as AntMenu } from 'antd';
import { useRouter } from 'next/navigation';
import type { NavItem, PermissionKey, NavigationMenuConfig } from './types';
import { useNavigation } from './hooks';

export interface MenuProps extends Omit<NavigationMenuConfig, 'items'> {
  items: NavItem[];
  userPermissions?: PermissionKey[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Enterprise Navigation Menu Component.
 * Wraps Ant Design's Menu with Next.js App Router integration,
 * permission filtering, and active route detection.
 */
export const Menu: React.FC<MenuProps> = ({
  items,
  userPermissions = [],
  mode = 'inline',
  theme = 'light',
  className,
  style,
}) => {
  const router = useRouter();
  const { filteredItems, pathname, openKeys } = useNavigation({
    items,
    userPermissions,
  });

  const handleMenuClick = ({ key }: { key: string }) => {
    // Find the clicked item to get its path or target
    const findItem = (nodes: NavItem[]): NavItem | null => {
      for (const node of nodes) {
        if (node.key === key) return node;
        if (node.children) {
          const found = findItem(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const clickedItem = findItem(filteredItems);

    if (clickedItem?.path) {
      if (clickedItem.target === '_blank') {
        window.open(clickedItem.path, '_blank');
      } else {
        router.push(clickedItem.path);
      }
    }
  };

  // Convert custom NavItem to Ant Design ItemType
  const formatAntItems = (nodes: NavItem[]): any[] => {
    return nodes
      .filter((node) => !node.hidden)
      .map((node) => ({
        key: node.key,
        label: node.label,
        icon: node.icon,
        disabled: node.disabled,
        children: node.children ? formatAntItems(node.children) : undefined,
      }));
  };

  const activeKey = pathname;

  return (
    <AntMenu
      className={className}
      style={style}
      mode={mode}
      theme={theme}
      selectedKeys={[activeKey]}
      defaultOpenKeys={openKeys}
      onClick={handleMenuClick}
      items={formatAntItems(filteredItems)}
    />
  );
};
