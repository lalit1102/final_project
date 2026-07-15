# Feedback Library

This folder contains reusable feedback states for loading, empty, error, result, and skeleton experiences.

## Features
- Loading and spinner states
- Empty-state and error-state components
- Result views with status-based messaging
- Skeleton support for placeholders

## Usage
```tsx
import { Loader, Empty, Error } from "@/components/feedback";

<Loader text="Loading data" />
<Empty title="No records" />
<Error title="Failed to load" />
```