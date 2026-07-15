import type { NavItem } from '../types';

/**
 * Determines which menu keys should be opened (expanded) in a nested navigation structure
 * based on the currently active pathname.
 *
 * @param items The navigation tree.
 * @param pathname The current route.
 * @param currentKeys Internal accumulator.
 * @returns An array of string keys that should be expanded.
 */
export function getOpenKeys(
  items: NavItem[],
  pathname: string,
  currentKeys: string[] = []
): string[] {
  for (const item of items) {
    if (item.path === pathname) {
      return currentKeys;
    }

    if (item.children) {
      const newKeys = [...currentKeys, item.key];
      const result = getOpenKeys(item.children, pathname, newKeys);
      
      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
}
