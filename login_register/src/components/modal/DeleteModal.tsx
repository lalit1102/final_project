"use client";

import { Typography } from "antd";
import Modal from "./Modal";
import type { DeleteModalProps } from "./types";

const { Text } = Typography;

export default function DeleteModal({ itemName, children, ...rest }: DeleteModalProps) {
  return (
    <Modal {...rest}>
      <Text>
        Are you sure you want to delete {itemName ?? "this item"}?
      </Text>
      {children}
    </Modal>
  );
}
