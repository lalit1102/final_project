export function filterNavItems(items, role) {
    if (!role)
        return [];
    return items.reduce((visible, item) => {
        if (!item.roles.includes(role)) {
            return visible;
        }
        const filtered = {
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
