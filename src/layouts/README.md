# Layout Library

This folder contains reusable shell layouts for auth, dashboard, and blank page scenarios.

## Features
- Responsive shell layout
- Sidebar support with collapse state
- Header, breadcrumb, and footer composition
- Dark/light and theme-ready structure

## Usage
```tsx
import { DashboardLayout, Header, Sidebar } from "@/layouts";

<DashboardLayout header={<Header title="Dashboard" />} sidebar={<Sidebar items={[]} />}>
  Content
</DashboardLayout>
```
