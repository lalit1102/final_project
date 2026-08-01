import type { NavItem } from '../types';

/**
 * Finds the active navigation item based on the current pathname.
 *
 * @param items The navigation tree.
 * @param pathname The active route from Next.js.
 * @returns The matching NavItem, or undefined if none is found.
 */
export function getActiveMenu(items: NavItem[], pathname: string): NavItem | undefined {
  for (const item of items) {
    if (item.path === pathname) {
      return item;
    }

    if (item.children) {
      const found = getActiveMenu(item.children, pathname);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}
