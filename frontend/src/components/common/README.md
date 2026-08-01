# Enterprise Common Component Library

A core foundational library containing highly reusable, generic components utilized across the entire enterprise application (Dashboards, Admin Panels, Settings, etc.).

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript (Strict Mode)
- Ant Design v5
- LESS Modules

## Architecture Rules Followed
- **Composition over Inheritance**: Features like `PageContainer` and `Section` accept standard React `children` rather than forcing complex prop config schemas.
- **Single Responsibility Principle**: Hooks (`useClipboard`) encapsulate pure logic separated from visual presentation (`CopyButton`).
- **DRY**: Shared constants and mapped logic (`getColorByStatus`, `formatStatus`) ensure rules are defined only once.
- **No `any` Types**: Strict TypeScript interfaces enforced via `types.ts`.

## Folder Structure
```
common/
 ├── helpers/      # Pure TS functions (no React dependencies)
 ├── hooks/        # Reusable React logic bridging helpers and components
 ├── styles/       # Scoped LESS modules avoiding global CSS leaks
 ├── PageContainer # Main layout boundary for routed pages
 ├── Section       # Content groupings
 └── ...           # Base atoms (CopyButton, StatusTag, TooltipText)
```

## Component APIs

### PageContainer
The standard wrapper for a Next.js route view.
```tsx
<PageContainer 
  title="User Management" 
  loading={false}
  extra={<Button type="primary">Add User</Button>}
>
  <Table />
</PageContainer>
```

### Section
A semantic `<section>` wrapper, optionally collapsible.
```tsx
<Section title="Billing Details" collapsible defaultExpanded={false}>
  <BillingForm />
</Section>
```

### StatusTag
Automates color assignment based on standard enterprise semantics.
```tsx
<StatusTag status="pending" /> // Automatically maps to standard warning/pending color and capitalizes
```

### TooltipText
Automatically handles text truncation and clipboard logic.
```tsx
<TooltipText text="Super long ID string 90238490238490238402" maxLength={15} copyable />
```

## Accessibility Notes
- Semantic HTML tags (`<section>`, `<main>`, `<header>`) are used throughout layouts.
- Buttons and collapsibles include `role` and `aria-expanded` where applicable.
- Focus management is handled natively by wrapped Ant Design components.
- Keyboard navigation is fully supported for `CopyButton` and `Section` toggles.
