import type { ModalProps, ModalFuncProps } from "antd";
import type { ReactNode } from "react";

export interface BaseModalProps extends Omit<ModalProps, "children" | "title"> {
  children?: ReactNode;
  title?: ReactNode;
  loading?: boolean;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  width?: number | string;
}

export interface ConfirmModalProps extends BaseModalProps {
  okText?: ReactNode;
  cancelText?: ReactNode;
  onOk?: () => void | Promise<void>;
  onClose?: () => void | Promise<void>;
}

export interface DeleteModalProps extends BaseModalProps {
  itemName?: ReactNode;
}

export interface FormModalProps extends BaseModalProps {
  form?: ReactNode;
}

export interface PreviewModalProps extends BaseModalProps {
  preview?: ReactNode;
}

export interface ModalApiOptions extends ModalFuncProps {
  promise?: boolean;
}
