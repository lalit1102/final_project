import type { ReactNode } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  content?: ReactNode;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  okText?: string;
  cancelText?: string;
  okButtonDanger?: boolean;
  confirmLoading?: boolean;
  destroyOnHidden?: boolean;
}
