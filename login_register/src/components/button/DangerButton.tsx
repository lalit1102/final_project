"use client";

import Button from "./Button";
import type { BaseButtonProps } from "./types";

export default function DangerButton(props: BaseButtonProps) {
  return <Button {...props} danger />;
}
