# Button Library

This folder contains a reusable enterprise button system built on top of Ant Design.

## Architecture
- Button is the shared base component.
- Specialized components compose from the base button to avoid duplicated logic.
- Helpers and hooks centralize loading, disabled, and permission concerns.

## Usage
```tsx
import { Button, DangerButton, LoadingButton, ButtonGroup } from "@/components/button";

<Button fullWidth>Submit</Button>
<LoadingButton loading loadingText="Saving...">Save</LoadingButton>
<DangerButton danger>Delete</DangerButton>
<ButtonGroup>
  <Button>Cancel</Button>
  <Button type="primary">Save</Button>
</ButtonGroup>
```

## Best Practices
- Keep common behavior in the shared button base.
- Prefer the specialized components for common enterprise scenarios.
- Use permission hooks for future role-based UI restrictions.

## Accessibility
- Buttons expose aria-label and aria-disabled for assistive technology.
- Keyboard interaction remains native through the Ant Design button.
