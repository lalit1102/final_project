# Enterprise Navigation Library

A robust, type-safe, and highly reusable navigation system designed for Enterprise applications like Dashboards, ERPs, and Admin Panels.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript (Strict, no `any`)
- Ant Design v5
- LESS Modules

## Features
- **Dynamic Breadcrumbs**: Automatically builds a breadcrumb trail by reading the active Next.js pathname against a centralized menu schema.
- **Permission-Aware**: The `filterMenuByPermission` helper prunes the menu tree before rendering based on user roles.
- **Deeply Integrated Next.js Routing**: Components use `usePathname` and `useRouter` internally. Tabs dynamically switch paths without losing application state.
- **SOLID & DRY Design**: Separation of Concerns achieved via granular hooks (`useSidebar`, `useNavigation`) and pure functional helpers.
- **Ant Design v5 Aesthetics**: Inherits your application's Ant Design tokens dynamically.

## Folder Structure

```
navigation/
 ├── helpers/      # Pure business logic (filtering, path finding)
 ├── hooks/        # React lifecycle & Next.js integrations
 ├── styles/       # LESS Modules
 ├── Breadcrumb    # Auto-generating trail
 ├── Menu          # Main Sidebar/Topbar
 ├── PageHeader    # View composer (Title, Back, Breadcrumb, Actions)
 ├── Tabs          # Route-integrated tabs
 └── ...
```

## Example Usage

### 1. Define Menu Schema
```tsx
import type { NavItem } from '@/components/navigation';
import { DashboardOutlined, SettingOutlined } from '@ant-design/icons';

const APP_MENU: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardOutlined />,
    path: '/dashboard',
    permissions: ['VIEW_DASHBOARD']
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: <SettingOutlined />,
    path: '/settings',
    permissions: ['ADMIN']
  }
];
```

### 2. Implement the Sidebar Menu
```tsx
import { Menu } from '@/components/navigation';

export default function Sidebar({ userRoles }) {
  return (
    <Menu 
      items={APP_MENU} 
      userPermissions={userRoles} 
      theme="dark"
    />
  );
}
```

### 3. Implement the Page Header
```tsx
import { PageHeader } from '@/components/navigation';
import { Button } from 'antd';

export default function DashboardPage() {
  return (
    <PageHeader 
      title="Dashboard" 
      subtitle="Overview of your metrics"
      menuItems={APP_MENU}
      extra={<Button type="primary">Download Report</Button>}
    />
  );
}
```
