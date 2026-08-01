"use client";

import Modal from "./Modal";
import type { ConfirmModalProps } from "./types";
import { DEFAULT_CONFIRM_CANCEL_TEXT, DEFAULT_CONFIRM_OK_TEXT } from "./constants";

export default function ConfirmModal({
  okText = DEFAULT_CONFIRM_OK_TEXT,
  cancelText = DEFAULT_CONFIRM_CANCEL_TEXT,
  onOk,
  onClose,
  children,
  ...rest
}: ConfirmModalProps) {
  return (
    <Modal
      {...rest}
      confirmText={okText}
      cancelText={cancelText}
      onConfirm={onOk}
      onCancel={onClose}
    >
      {children}
    </Modal>
  );
}
