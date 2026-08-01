# Modal Library

This folder contains reusable modal primitives for confirm flows, delete actions, form dialogs, and content previews.

## Features
- Promise-based confirm flow support
- Loading state support
- Accessible modal wrapper around Ant Design
- Specialized variants for confirmation and destructive actions

## Usage
```tsx
import { Modal, ConfirmModal, DeleteModal } from "@/components/modal";

<ConfirmModal open title="Proceed" onOk={() => console.log("ok")}>Continue?</ConfirmModal>
```