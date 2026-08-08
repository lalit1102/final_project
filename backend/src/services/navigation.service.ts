import { IUser } from "@/types/user.types";
import { NavigationItem } from "@/types/navigation.types";
import { hasPermission } from "@/lib/permissions";
import { NAVIGATION_ITEMS } from "@/config/navigation.config";

export class NavigationService {
  getNavigation(user: IUser): NavigationItem[] {
    return this.filterNavigation(NAVIGATION_ITEMS, user);
  }

  private filterNavigation(items: NavigationItem[], user: IUser): NavigationItem[] {
    const filtered: NavigationItem[] = [];

    for (const item of items) {
      const visibleChildren = item.children
        ? this.filterNavigation(item.children, user)
        : undefined;

      const hasAccess = !item.permission || hasPermission(user.role, item.permission);
      const hasVisibleChildren = visibleChildren && visibleChildren.length > 0;

      if (!hasAccess && !hasVisibleChildren) {
        continue;
      }

      filtered.push({
        ...item,
        children: visibleChildren,
      });
    }

    return filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
}

export const navigationService = new NavigationService();
