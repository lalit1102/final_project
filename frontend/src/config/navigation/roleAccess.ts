import type { NavItem } from './types';

export function filterNavItems(items: NavItem[], role: string | undefined): NavItem[] {
  if (!role) return [];

  return items.reduce<NavItem[]>((visible, item) => {
    if (!item.roles.includes(role as NavItem['roles'][number])) {
      return visible;
    }

    const filtered: NavItem = {
      key: item.key,
      label: item.label,
      path: item.path,
      icon: item.icon,
      roles: item.roles,
    };

    if (item.children && item.children.length > 0) {
      const visibleChildren = filterNavItems(item.children, role);
      if (visibleChildren.length > 0) {
        filtered.children = visibleChildren;
      }
    }

    visible.push(filtered);
    return visible;
  }, []);
}
