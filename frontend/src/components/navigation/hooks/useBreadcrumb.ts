'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { NavItem, BreadcrumbItem } from '../types';
import { buildBreadcrumbs } from '../helpers';

/**
 * Hook to automatically generate breadcrumbs based on the current Next.js route
 * and the provided navigation schema.
 *
 * @param items The complete, unfiltered navigation tree.
 * @returns Array of BreadcrumbItems for the current route.
 */
export function useBreadcrumb(items: NavItem[]): BreadcrumbItem[] {
  const pathname = usePathname() || '';

  const breadcrumbs = useMemo(() => {
    if (!items || items.length === 0) return [];
    return buildBreadcrumbs(items, pathname);
  }, [items, pathname]);

  return breadcrumbs;
}
