# Card Library

This folder contains an enterprise-ready card system built on top of Ant Design Card.

## Features
- Responsive layouts
- Loading and skeleton states
- Header and footer composition
- Specialized cards for stats, profiles, info, and empty states

## Usage
```tsx
import { Card, StatsCard, EmptyCard } from "@/components/card";

<Card title="Overview" loading={false}>Content</Card>
<StatsCard title="Revenue" value="$12k" description="This month" />
<EmptyCard emptyText="No records" />
```
