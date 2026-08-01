import type { NavItem, PermissionKey } from "../types";

/**
 * Filters navigation items based on user permissions.
 * Supports nested menu structure (recursive).
 */
export function filterMenuByPermission(
  items: NavItem[],
  userPermissions: PermissionKey[]
): NavItem[] {
  return items.reduce<NavItem[]>((acc, item) => {
    const itemPermissions = item.permissions ?? [];

    // ✅ Check permission (if no permissions defined → allow by default)
    const hasPermission =
      itemPermissions.length === 0 ||
      itemPermissions.some((perm) => userPermissions.includes(perm));

    if (!hasPermission) return acc;

    // ✅ Clone item safely
    const newItem: NavItem = { ...item };

    // ✅ Handle children recursively
    if (newItem.children?.length) {
      newItem.children = filterMenuByPermission(
        newItem.children,
        userPermissions
      );

      // ❌ Remove parent if it had children but all got filtered out
      if (newItem.children.length === 0) {
        return acc;
      }
    }

    acc.push(newItem);
    return acc;
  }, []);
}