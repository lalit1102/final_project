"use client";

import { Modal } from "antd";
import Button from "./Button";
import type { ConfirmButtonProps } from "./types";

export default function ConfirmButton({
  title,
  description,
  okText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  children,
  ...rest
}: ConfirmButtonProps) {
  const handleConfirm = () => {
    Modal.confirm({
      title,
      content: description,
      okText,
      cancelText,
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
