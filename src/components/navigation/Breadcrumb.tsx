'use client';

import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import Link from 'next/link';
import type { NavItem } from './types';
import { useBreadcrumb } from './hooks';

export interface BreadcrumbProps {
  items: NavItem[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Enterprise Breadcrumb Component.
 * Automatically derives the breadcrumb trail from the Next.js router
 * and the provided application menu structure.
 */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
  style,
}) => {
  const trail = useBreadcrumb(items);

  if (trail.length === 0) return null;

  return (
    <AntBreadcrumb className={className} style={style}>
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;
        const content = (
          <span className="flex items-center gap-2">
            {item.icon}
            {item.label}
          </span>
        );

        return (
          <AntBreadcrumb.Item key={item.key}>
            {item.path && !isLast ? (
              <Link href={item.path}>{content}</Link>
            ) : (
              content
            )}
          </AntBreadcrumb.Item>
        );
      })}
    </AntBreadcrumb>
  );
};
