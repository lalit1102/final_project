import type { NavItem, BreadcrumbItem } from '../types';

/**
 * Recursively searches the navigation tree to build a breadcrumb trail based on the current pathname.
 *
 * @param items The array of navigation items (menu structure).
 * @param pathname The current active route (e.g., from Next.js usePathname).
 * @param currentPath Internal accumulator for the current recursive path.
 * @returns Array of BreadcrumbItem representing the path to the active node.
 */
export function buildBreadcrumbs(
  items: NavItem[],
  pathname: string,
  currentPath: BreadcrumbItem[] = []
): BreadcrumbItem[] {
  for (const item of items) {
    const itemPath: BreadcrumbItem = {
      key: item.key,
      label: item.label,
      path: item.path,
      icon: item.icon,
    };

    const newPath = [...currentPath, itemPath];

    // If we've found the exact match, return the accumulated path
    if (item.path === pathname) {
      return newPath;
    }

    // If it has children, search deeper
    if (item.children && item.children.length > 0) {
      const childResult = buildBreadcrumbs(item.children, pathname, newPath);
      if (childResult.length > 0) {
        return childResult;
      }
    }
  }

  // Return empty if not found in this branch
  return [];
}
