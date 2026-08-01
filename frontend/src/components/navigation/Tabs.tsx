'use client';

import React from 'react';
import { Tabs as AntTabs } from 'antd';
import type { TabsProps as AntTabsProps } from 'antd';
import { useRouter, usePathname } from 'next/navigation';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  path: string;
  disabled?: boolean;
}

export interface TabsProps extends Omit<AntTabsProps, 'items' | 'onChange' | 'activeKey'> {
  items: TabItem[];
  className?: string;
}

/**
 * Navigation Tabs for section switching, heavily integrated with Next.js App Router.
 * Changing tabs updates the URL, retaining history and deep-linking capabilities.
 */
export const Tabs: React.FC<TabsProps> = ({ items, className, ...rest }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Find the active tab key based on the current URL
  const activeKey = React.useMemo(() => {
    const matched = items.find((item) => pathname?.startsWith(item.path));
    return matched ? matched.key : items[0]?.key;
  }, [items, pathname]);

  const handleChange = (key: string) => {
    const target = items.find((item) => item.key === key);
    if (target) {
      router.push(target.path);
    }
  };

  const antItems = items.map((item) => ({
    key: item.key,
    label: item.label,
    disabled: item.disabled,
  }));

  return (
    <AntTabs
      {...rest}
      className={className}
      activeKey={activeKey}
      onChange={handleChange}
      items={antItems}
    />
  );
};
