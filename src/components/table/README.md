# Table Library

This folder contains a reusable table foundation for enterprise CRUD and list pages.

## Features
- Server pagination support
- Search and filter composition
- Toolbar and actions area
- Empty-state support

## Usage
```tsx
import { Table, TableToolbar, TableSearch } from "@/components/table";

<Table columns={columns} dataSource={data} />
```