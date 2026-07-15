"use client";

import Modal from "./Modal";
import type { FormModalProps } from "./types";

export default function FormModal({ form, children, ...rest }: FormModalProps) {
  return (
    <Modal {...rest}>
      {form ?? children}
    </Modal>
  );
}
