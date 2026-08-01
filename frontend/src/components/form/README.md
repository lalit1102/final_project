# Form Library

This folder contains a reusable, typed form layer built on top of React Hook Form and Ant Design for enterprise-grade UI forms.

## Architecture
- Form is the provider wrapper for form state and submission.
- FormItem is the single source of truth for controller wiring, validation messaging, required marks, help text, dependencies, and layout behavior.
- Each field component maps form state to the relevant Ant Design control while preserving parent callbacks and keeping the API compatible.
- Shared types, constants, helpers, and hooks live in dedicated modules to avoid duplication and improve maintainability.

## Installation
```bash
npm install react-hook-form antd @hookform/resolvers zod
```

## Usage
```tsx
import { Form, FormInput, FormPassword, FormSelect } from "@/components/form";

const methods = useForm({
  defaultValues: {
    email: "",
    password: "",
    role: undefined,
  },
});

<Form methods={methods} onSubmit={(values) => console.log(values)}>
  <FormInput name="email" label="Email" rules={{ required: "Email is required" }} />
  <FormPassword name="password" label="Password" rules={{ required: "Password is required" }} />
  <FormSelect name="role" label="Role" options={[{ label: "Admin", value: "admin" }]} />
</Form>
```

## Best Practices
- Keep validation rules close to the field definition.
- Prefer shared helpers and hooks over per-component logic.
- Use the common field props for consistent behavior across all controls.
- Preserve parent callbacks when wiring to Ant Design controls.

## Common Mistakes
- Spreading the entire field object directly into a component instead of mapping the correct Ant Design props.
- Forgetting to support both RHF and parent callback handlers.
- Duplicating validation and layout logic in each field component.

## Future Enhancements
- Add schema-driven form generation from Zod definitions.
- Expand examples for async validation, upload pipelines, and dynamic field dependencies.
