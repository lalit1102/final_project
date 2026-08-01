"use client";

import { Modal as AntModal, Spin } from "antd";
import type { BaseModalProps } from "./types";
import { DEFAULT_MODAL_WIDTH } from "./constants";

export default function Modal({
  children,
  title,
  open,
  loading,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  width = DEFAULT_MODAL_WIDTH,
  ...rest
}: BaseModalProps) {
  return (
    <AntModal
      {...rest}
      open={open}
      title={title}
      width={width}
      okText={confirmText}
      cancelText={cancelText}
      onOk={onConfirm}
      onCancel={onCancel}
    >
      {loading ? <Spin tip="Loading...">{children}</Spin> : children}
    </AntModal>
  );
}
