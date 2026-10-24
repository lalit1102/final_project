# Layout Library

This folder contains reusable shell layouts for auth, dashboard, and blank page scenarios.

## Layouts

- `AuthLayout` — Centered auth pages (login, register)
- `DashboardLayout` — Full admin layout with sidebar, header, breadcrumb, footer
- `BlankLayout` — Minimal layout for standalone pages

## Usage

```tsx
import DashboardLayout from "@/layouts/DashboardLayout";

<DashboardLayout>
  {children}
</DashboardLayout>
```

## Architecture

```
layouts/
├── DashboardLayout/
│   ├── DashboardLayout.tsx
│   ├── Header/
│   │   ├── Header.tsx
│   │   └── Header.module.css
│   ├── Sidebar/
│   │   ├── Sidebar.tsx
│   │   └── Sidebar.module.css
│   ├── Footer/
│   │   ├── Footer.tsx
│   │   └── Footer.module.css
│   └── Breadcrumb/
│       ├── Breadcrumb.tsx
│       └── Breadcrumb.module.css
├── AuthLayout.tsx
├── BlankLayout.tsx
├── types.ts
└── index.ts
```
