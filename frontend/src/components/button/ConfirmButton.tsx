"use client";

import { Modal } from "antd";
import Button from "./Button";
import type { ConfirmButtonProps } from "./types";

export default function ConfirmButton({
  confirmTitle,
  confirmDescription,
  okText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
  ...rest
}: ConfirmButtonProps) {
  const handleConfirm = () => {
    Modal.confirm({
      title: confirmTitle,
      content: confirmDescription,
      okText: typeof okText === 'string' ? okText : undefined,
      cancelText: typeof cancelText === 'string' ? cancelText : undefined,
      onOk: onConfirm,
      onCancel,
    });
  };

  return (
    <Button {...rest} onClick={handleConfirm}>
      {children}
    </Button>
  );
}
