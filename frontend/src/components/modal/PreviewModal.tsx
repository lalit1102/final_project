"use client";

import Modal from "./Modal";
import type { PreviewModalProps } from "./types";

export default function PreviewModal({ preview, children, ...rest }: PreviewModalProps) {
  return (
    <Modal {...rest}>
      {preview ?? children}
    </Modal>
  );
}
